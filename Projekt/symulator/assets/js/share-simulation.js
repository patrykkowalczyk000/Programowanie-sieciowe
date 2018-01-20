"use strict";

/**
 * Zwraca ilość milisekund od momentu załadowania strony
 */
var now = function(){
    // Różnica między czasem gościa i użytkownika rozpoczynającego symulację.
    var diff = parseFloat(performance.timing.navigationStart) - parseFloat(simulationData.refTime);

    return parseFloat(parseFloat(parseFloat(performance.now()) + diff).toFixed(3));
};

/**
 * Ustawienia
 */
var options = {
    // Adres URL serwera symulacji
    websocket     : "ws://" + location.hostname + ":8081/?userId="+simulationParameters.userId+"&simId="+simulationParameters.simulationId,
    // Domyślnie prezentowany parameter na wykresie
    activeParam   : "s_n_k",
    // Ilość danych do pokazania na wykresie
    showOnChart   : 100,
    // Interwał odświeżania wykresu (ms)
    updateChart   : 150,
    // Czas ostatniego odświeżenia wykresu
    lastChartUpdated : performance.now(),
    // Czy symulacja została uruchomiona
    started       : false,
    // Jednostki każdego parametru
    units: {
        "s_tp_k"  : "&deg; C",
        "s_tch_k" : "&deg; C",
        "s_ro_k"  : "",
        "s_n_k"   : "1/cm3",
        "s_hks_k" : "cm",
        "s_Q_k"   : "W",
        "roxe"    : "",
        "rosm"    : "",
        "ropal"   : "",
        "rom"     : "",
        "rohks"   : "",
        "roep"    : "",
        "rob"     : "",
    },
    // Przypisanie nazwy parametru do indexu z tablicy z wynikiem kroku symulacji
    indexToVariable: {
        0   : "T",
        1   : "s_n_k",
        2   : "s_Q_k",
        3   : "s_tp_k",
        4   : "s_tch_k",
        5   : "s_ro_k",
        6   : "rohks",
        7   : "rom",
        8   : "roep",
        9   : "rob",
        10  : "roxe",
        11  : "rosm",
        12  : "ropal",
        13  : "s_hks_k",
        14  : "ST",
        15  : "t"
    }
};

// Dane wyświetlane na głównym wykresie
var simData = {
    "s_tp_k"  : [],
    "s_tch_k" : [],
    "s_ro_k"  : [],
    "s_n_k"   : [],
    "s_hks_k" : [],
    "s_Q_k"   : [],
    "roxe"    : [],
    "rosm"    : [],
    "ropal"   : [],
    "rom"     : [],
    "rohks"   : [],
    "roep"    : [],
    "rob"     : []
};

    // Dane do wyświetlenia na wykresie opóźnienia
var delaysData            = [{x:0, y:0}],
    // Dane do wyświetlenia na wykresie czasu komunikacji
    communicationTimeData = [{x:0, y:0}],
    // Dane do wyświetlenia na wykresie kroku symulacji
    stepData              = [{x:0, y: 0}];

/**
 * Funkcje związane z prezentowaniem danych na głównym wykresie
 * i kontenerach z wartościami liczbowymi
 */
var simulationData = {
    // Czas symulacji (ms)
    time      : 0,
    // Czas rzeczywisty rozpoczęcia symulacji (ms)
    startTime : 0,
    // Czas rzeczywisty symulacji (ms)
    realTime  : 0,
    // Data rozpoczęcia symulacji
    date: simulationParameters.date,
    // Czas uruchomienia symulacji prze użytkownika, który ją udostępokazania
    refTime   : 0,

    // Głowny wykres
    chart: new CanvasJS.Chart("simulationChart", {
        zoomEnabled: true,
        axisX: {
            title: "Czas [s]",
            titleFontSize: 13
        },
        axisY: {
            titleFontSize: 13,
            title: "Stężenie neutronów [1/cm3]"
        },
        data: [
            {
                type: "line",
                dataPoints: simData.s_tch_k
            }
        ]
    }),

    // Kontenery z danymi wyświetlanymi w postaci liczby
    boxes: {
        // Kontener czasu symulacji
        simTimeBox : $('#simTime'),

        // Parametry do wyświetlenia w kontenerach od 1 do 3
        params: {
            "1" : "s_Q_k",
            "2" : "s_tp_k",
            "3" : "s_tch_k",
        },

        /**
         * Zmiana wyświetlanego parametru
         * @param {int}    box   Identyfikator kontenera
         * @param {string} param Parametr do wyświetlania
         */
        change: function(box, param) {
            var i;

            this.params[box] = param;
            for(i in this.params) {
                $('#box-' + i).find('.value').html(String(simData[this.params[i]][simData[this.params[i]].length - 1].y).substr(0, 19));
                $('#box-' + i).find('.unit').html(options.units[this.params[i]]);
            }
        },

        /**
         * Aktualizacja danych
         * @param {object} t    Czas symulacji
         * @param {object} data Wyniki kroku symulacji
         */
        update: function (t, data) {
            var i;

            for(i in this.params) {
                $('#box-' + i).find('.value').html(String(data[this.params[i]]).substr(0, 19));
                $('#box-' + i).find('.unit').html(options.units[this.params[i]]);
            }
            this.simTimeBox.html(parseFloat(t).toFixed(5));
        },

        /**
         * Inicjalizacja kontenerów
         */
        init: function() {
            var i;

            for(i in this.params) {
                $('select[data-box="' + i + '"] option').each(function (){
                    $(this).prop("selected", false);
                });
                $('select[data-box="' + i + '"] option[value="' + this.params[i] + '"]').prop("selected", true);
            }
        }
    },

    /**
     * Aktualizacja wyników symulacji
     * @param {object} data    Wyniki kroku symulacji
     */
    update: function(data) {
        this.time = parseFloat(data.T)*1e3;
        this.realTime = now() - parseFloat(this.startTime);

        for(var i in data) {
            if (simData.hasOwnProperty(i)) {
                simData[i].push({x: this.time, y:parseFloat(data[i])});

                // Usunięcie danych, jeżeli przekroczono max. ilość
                if (simData[i].length > options.showOnChart) {
                    simData[i].shift();
                }
            }
        }
        this.boxes.update(this.time*1e-3, data);
    }
};
// Inicjalizacja kontenerów z danymi wyświetlanymi w formie liczby
simulationData.boxes.init();

/**
 * Komunikaty
 */
var loading = {
    overflow : $('#new-simulation-overflow'),
    message  : $('#simulatorStatus'),
    icon     : $('#simulatorIcon'),

    /**
     * Ukryj komunikaty
     */
    hide: function () {
        this.overflow.hide();
    },

    /**
     * Pokaż komunikaty
     */
    show: function () {
        this.overflow.show();
    },

    /**
     * Ustaw treść komunikatu
     *
     * @param {String} msg  Treść komunikatu
     */
    setMessage: function (msg) {
        var messages = {
            "1": "Symulator pracuje obecnie nad inną symulacją. Poczekaj na jej zakończenie.<br/>Za 5 sekund nastąpi ponowna próba uruchomienia symulacji.",
            "2": "Symulator nie jest jeszcze gotowy.<br/>Za sekundę nastąpi ponowna próba uruchomienia symulacji."
        }

        if (messages[msg] != undefined) {
            msg = messages[msg];
        }

        this.message.html(msg);
    },

    /**
     * Ustaw ikonę
     *
     * @param {String} icon Ikona
     */
    setIcon: function (icon) {
        var icons = {
            loading : "ion-ios-loop-strong spinning",
            error   : "ion-ios-close-outline"
        };

        this.icon.removeClass();
        this.icon.addClass(icons[icon]);
    }
};

/**
 * Funkcje związane z wyświetlanie informacji diagnostycznych
 */
var diagnostics = {
    // Czas komunikacji (ms)
    communicationTime       : 0,
    // Maksymalny czas komunikacji (ms)
    maxCommunicationTime    : 0,
    // Średni czas komunikacji (ms)
    avgCommunicationTime    : 0,
    // Suma wszystkich czasów komunikacji (ms)
    communicationTimeSum    : 0,

    maxCommunicationTimeBox : $('#maxCommunicationTime'),
    avgCommunicationTimeBox : $('#avgCommunicationTime'),

    // Wykres czasu komunikacji
    communicationTimeChart  : new CanvasJS.Chart("communicationTimeChart", {
        zoomEnabled: true,
        axisX: {
            title: "Czas [s]",
            titleFontSize: 13
        },
        axisY: {
            minimum: 0,
            titleFontSize: 13,
            title: "Czas komunikacji [ms]"
        },
        data: [
            {
                type: "line",
                dataPoints: communicationTimeData
            }
        ]
    }),

    // Opóźnienie (ms)
    delay        : 0,
    // Maksymalne opóźnienie (ms)
    maxDelay     : 0,
    // Średnie opóźnienei (ms)
    avgDelay     : 0,
    // Suma wszystkich opóźnień (ms)
    delaysSum    : 0,

    maxDelayBox  : $('#maxDelay'),
    avgDelayBox  : $('#avgDelay'),

    // Wykres opóźnień i kroku symulacji
    delaysChart  : new CanvasJS.Chart("stepDelaysChart", {
        zoomEnabled: true,
        axisY: {
            minimum: 0,
            titleFontSize: 13,
            title: "Opóźnienie [ms]"
        },
        axisX: {
            title: "Czas [s]",
            titleFontSize: 13
        },
        data: [
            {
                type: "line",
                dataPoints: delaysData,
                showInLegend: true,
                legendText: "Opóźnienie"
            },
            {
                type: "stepLine",
                dataPoints: stepData,
                showInLegend: true,
                legendText: "Krok symulacji"
            }
        ]
    }),

    // Ilość wysymulowanych kroków symulacji
    steps        : 0,

    /**
     * Aktualizauje informacje diagnostyczne
     * @param {float} now          Obecny czas (ms)
     * @param {float} receivedTime Czas wysłania żądania obliczenia kroku (ms)
     * @param {float} simTime      Czas symulacji otrzymany z symulatora (ms)
     * @param {float} step         Krok symulacji (ms)
     */
    update: function(now, sendTime, simTime, step) {
        this.steps++;
        // Czas symulacji
        simTime = parseFloat(simTime);

        // Czas komunikacji
        this.communicationTime = parseFloat(now - sendTime);
        this.communicationTimeSum += this.communicationTime;

        if (this.communicationTime > this.maxCommunicationTime) {
            this.maxCommunicationTime = this.communicationTime;
        }

        this.avgCommunicationTime = this.communicationTimeSum / this.steps;

        this.maxCommunicationTimeBox.html(this.maxCommunicationTime.toFixed(3));
        this.avgCommunicationTimeBox.html(this.avgCommunicationTime.toFixed(3));
        communicationTimeData.push({x: simTime, y: this.communicationTime});

        // Opóźnienie
        this.delay = simulationData.realTime - simulationData.time;
        this.delaysSum += this.delay;

        if(this.delay > this.maxDelay){
            this.maxDelay = this.delay;
        }
        this.avgDelay = this.delaysSum / this.steps;
        this.maxDelayBox.html(this.maxDelay.toFixed(3));
        this.avgDelayBox.html(this.avgDelay.toFixed(3));
        delaysData.push({x: simTime, y: this.delay});

        // Krok symulacji
        stepData.push({x: simTime, y: parseFloat(step)});

        // Usunięcie z wykresu danych, jeżeli została przekroczona max. ilość
        if(communicationTimeData.length > options.showOnChart) {
            delaysData.shift();
            communicationTimeData.shift();
            stepData.shift();
        }

    }
};

/**
 * Inicjalizuje połączenie z symulatorem
 */
var initSimulationConnection = function() {
    var ws = new WebSocket(options.websocket);

    /**
     * Nowa wiadomość z serwera
     */
    ws.onmessage = function (e) {
        var data = JSON.parse(e.data);

        // Wyniki obliczonego kroku symulacji
        if(options.started && simulationData.startTime != 0.0) {
            var time         = simulationData.time,
                realTime     = simulationData.realTime,
                startTime    = simulationData.startTime,
                receivedTime = now();

            var stepResults = {};
            for(var i in data.r){
                stepResults[options.indexToVariable[i]] = data.r[i];
            }

            // Aktualizacja wykresów
            if(performance.now() - options.lastChartUpdated >= options.updateChart) {
                diagnostics.communicationTimeChart.render();
                diagnostics.delaysChart.render();
                simulationData.chart.render();
                options.lastChartUpdated = performance.now();
            }
            // Jeżeli wyniki symulacji dotarły zbyt szybko, czekamy do końca kroku symulacji
            // simulationData.realTime = now() - simulationData.startTime;
            // while(simulationData.realTime < simulationData.time) {
            //     simulationData.realTime = now() - simulationData.startTime;
            // };

            time             += data.r[14]*1e3;
            realTime          = receivedTime - startTime;
            diagnostics.delay = parseFloat(realTime - time);

            // Jeżeli wyniki symulacji dotarły zbyt szybko, czekamy do końca kroku symulacji
            if(realTime < time) {
                while(realTime < time) {
                    realTime = now() - startTime;
                }
                realTime = simulationData.time + data.r[14]*1e3;
            }
            simulationData.time += data.r[14]*1e3;
            simulationData.realTime = realTime;

            simulationData.update(stepResults);
            diagnostics.update(receivedTime, data.r[15], data.r[0], data.r[14]*1e3);

        }
        // Informacje o czasie uruchomienia symulacji
        if(data.hasOwnProperty("i")) {
                simulationData.refTime = data.i[0];
                simulationData.startTime = data.i[1];

                options.started = true;
                loading.hide();
        }
    };

    /**
     * Nawiązanie połączenia z serwerem
     */
     ws.onopen = function () {
         loading.setIcon("loading");
         loading.setMessage('Nawiązano połączenie.<br/>Oczekiwanie na dane...');
     };

    /**
     * Zakończenie połączenia z serwerem
     */
    ws.onclose = function (e) {
        ws = {};
        options.started = false;
        loading.setIcon("error");
        loading.setMessage('Symulator nie odpowiada.<br /><a class="btn btn-xs btn-default" href="" onclick="document.location.refresh">Spróbuj połączyć się ponownie</a>');
    }
};


$('#showParameter').change(function(e){
    var value = $(this).val();
    options.activeParam = value;

    simulationData.chart.options.data[0].dataPoints = simData[value];
    simulationData.chart.options.axisY.title = $(this).find('option[value="'+value+'"]').html() + " [" + (options.units[value] ? options.units[value] : ' - ') + "]";
    simulationData.chart.render();
});

$('select[data-action="change-param"]').change(function(e){
    simulationData.boxes.change($(this).data('box'), $(this).val());
});

// Inicjalizacja połączenia z serwerem
initSimulationConnection();
