"use strict";

// Akcje obsługiwane przez serwer symulacji
var SETUP     = 1,  // Ustaw parametry symulacji
    SIMULATE  = 2,  // Oblicz kolejny krok symulacji
    SET_PARAM = 3,  // Ustaw wartość parametru sterowania
    STOP      = 5;  // Zatrzymaj symulację

/**
 * Adaptacja kroku symulacji
 */
var step = {
    // Krok bazowy (ms)
    baseStep        : simulationParameters.step,
    // Aktualny krok (ms)
    step            : simulationParameters.step,
    // Czas ostatniej zmiany kroku (ms)
    stepChangeTime  : 0,
    // Minimalny czas pomiędzy zmianami kroku (ms)
    stepChangeDelay : simulationParameters.step * 25,
    // Ilość mniejszych kroków na jakie zostania podzielony nowy krok
    miniSteps       : 10,
    // Maksymalny przyrost kroku
    maxIncrease     : 3,
    // Maksymalny krok
    maxStep         : 40,

    /**
     * Zwraca aktualny krok
     * @returns {float} Aktualny krok (ms);
     */
    get: function() {
        return this.step;
    },

    /**
     * Dostosowanie kroku symulacji
     * @returns {float} Nowy krok symulacji (ms)
     */
    adapt: function () {

    },

    /**
     * Oblicza krok symulacji
     * @param   {float} communicationTime Czas komunikacji (ms)
     * @param   {float} delay             Opóźnienie względem czasu rzeczywistego (ms)
     * @param   {float} step              Obecny krok symulacji (s)
     * @returns {float} Nowy krok symulacji (ms)
     */
    getNew: function () {
        var Step     = Math.floor(2*(this.baseStep+diagnostics.delay)/this.baseStep),
            miniStep = Math.ceil((Step*this.baseStep - this.step)/this.miniSteps),
            newStep  = this.step;

        // Zmniejszenie kroku, jeżeli nowy krok symulacji obliczany jest szybciej
        if(diagnostics.delay < 0) {
            miniStep = Math.floor((Step*this.baseStep - this.step)/this.miniSteps);

            if(miniStep < this.baseStep-this.step || this.step < this.baseStep) {
                miniStep = this.baseStep - this.step;
            }
        }

        // Jeżeli upłynął minimalny czas między zmianami kroku następuje zmiana kroku
        if(now() > this.stepChangeTime + this.stepChangeDelay) {
            newStep = this.step + miniStep;

            // Ograniczenie szybkości zmian kroku
            if(Math.abs(newStep - this.step) > this.maxIncrease) {
                if(newStep - this.step < 0) {
                    newStep = newStep - (newStep - this.step) - this.maxIncrease;
                } else {
                    newStep = newStep - (newStep - this.step) + this.maxIncrease;
                }

            }

            // Ograniczenie maksymalnego kroku
            if(newStep > this.maxStep) {
                newStep = this.maxStep;
            }

            this.stepChangeTime = now();
        }


        this.step = newStep;
        return this.step;
    }
};

/**
 * Zwraca ilość milisekund od momentu załadowania strony
 */
var now = function(){
    return parseFloat(parseFloat(performance.now()).toFixed(3));
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
    lastChartUpdated : now(),
    // Czy symulacja została uruchomiona
    started       : false,
    // Ilość zmienionych parametrów (od 0 do 3, dotyczy zmiany sterowania)
    paramsChanges : 0,
    // Ilość parametrów, których zmiana została potwierdzona
    paramsChanged : 0,
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
    stepData              = [{x:0, y:step.get()}];

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
                dataPoints: simData[options.activeParam]
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
        for(var i in data) {
            if (simData.hasOwnProperty(i)) {
                simData[i].push({x: this.realTime*1e-3, y: parseFloat(data[i])});

                // Usunięcie danych, jeżeli przekroczono max. ilość
                if (simData[i].length > options.showOnChart) {
                    simData[i].shift();
                }
            }
        }

        this.boxes.update(this.realTime*1e-3, data);
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
     * @param {float} receivedTime  Czas otrzymania danych
     * @param {float} sendTime      Czas wysłania żądania obliczenia kroku
     */
    update: function(receivedTime, sendTime) {
        var simTime = parseFloat(simulationData.realTime*1e-3);
        this.steps++;

        this.communicationTime     = parseFloat(receivedTime - sendTime);
        this.communicationTimeSum += this.communicationTime;
        this.avgCommunicationTime  = this.communicationTimeSum / this.steps;

        if (this.communicationTime > this.maxCommunicationTime) {
            this.maxCommunicationTime = this.communicationTime;
        }

        this.maxCommunicationTimeBox.html(this.maxCommunicationTime.toFixed(3));
        this.avgCommunicationTimeBox.html(this.avgCommunicationTime.toFixed(3));

        communicationTimeData.push({x: simTime, y: this.communicationTime});


        this.delaysSum += (this.delay < 0 ? 0 : this.delay);
        this.avgDelay   = this.delaysSum / this.steps;

        if(this.delay > this.maxDelay){
            this.maxDelay = this.delay;
        }

        this.maxDelayBox.html(this.maxDelay.toFixed(3));
        this.avgDelayBox.html(this.avgDelay.toFixed(3));

        delaysData.push({x: simTime, y: this.delay});

        stepData.push({x: simTime, y: step.get()});

        // Usunięcie z wykresu danych, jeżeli została przekroczona max. ilość
        if(communicationTimeData.length > options.showOnChart) {
            delaysData.shift();
            communicationTimeData.shift();
            stepData.shift();
        }
    }
};

/**
 * Wysyła dane do serwera
 */
var SendRequest = {
    /**
     * Wyślij parametry symulacji
     *
     * @param {WebSocket} ws Obiekt WebSocket
     */
    Setup: function(ws) {
        var data = {
            a         : SETUP,
            date      : simulationParameters.date,
            refTime   : performance.timing.navigationStart,
        };

        ws.send(JSON.stringify(data));
    },

    /**
     * Oblicz nowy krok symulacji
     *
     * @param {WebSocket}   ws                  Obiekt WebSocket
     * @param {int}         step                Krok symulacji
     * @param {int}         lastDataRealTime    Czas otrzymania ostatniego wyniku
     * @param {int}         startTime           (Opcjonalne) Czas rozpoczęcia symulacji (ms)
     */
    Simulate: function(ws, step, lastDataRealTime, startTime){
        if(startTime == undefined){
            startTime = now();
        }
        var data = {
            a : SIMULATE,
            s : step,
            t : startTime,
            r : lastDataRealTime
        };

        ws.send(JSON.stringify(data));
    },

    /**
     * Zmień wartość wielkości sterującej
     *
     * @param {WebSocket}   ws      Obiekt WebSocket
     * @param {string}      param   Parametr
     * @param {float}       value   Wartość
     */
    SetParam(ws, param, value) {
        var data = {
            a : SET_PARAM,
            p : param,
            v : parseFloat(value)
        };

        ws.send(JSON.stringify(data));
    }
};

/**
 * Ustawia predefiniowane wartości sterowań
 *
 * @param {float}       time    Czas symulacji
 * @param {WebSocket}   ws  Obiekt WebSocket
 *
 * @return {int} Ilość zmienionych parametrów
 */
var setPredefinedControl = function(time, ws) {
    var param, i, value, x, next_i, changes = 0;

    time = (time+step.get())*1e-3;

    for(param in simulationParameters.predefinedControls) {
        for(i = 0; i<simulationParameters.predefinedControls[param].length; i++) {
            next_i = (i+1 < simulationParameters.predefinedControls[param].length ? i+1 : i);
            x      = simulationParameters.predefinedControls[param][i].x;
            value  = simulationParameters.predefinedControls[param][i].y;

            if(time >= x && time < simulationParameters.predefinedControls[param][next_i].x) {
                if($('input[data-param="'+param+'"]').val() != value) {
                    $('input[data-param="'+param+'"]').val(value);
                    changes++;
                    options.paramsChanges++;
                    SendRequest.SetParam(ws, param, value);
                    break;
                }
                break
            }
        }
    }

    return changes;
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
        if(options.started && data["error"] == undefined){
            var time         = simulationData.time,
                realTime     = simulationData.realTime,
                startTime    = simulationData.startTime,
                stepResults  = {},
                receivedTime = now();

            // Przepisanie wyników symulacji do tablicy asocjacyjnej
            for(var i in data.r){
                stepResults[options.indexToVariable[i]] = data.r[i];
            }

            // Sprawdzenie, czy wyniki symulacji nie są błędne
            if(stepResults.s_n_k == 0) {
                window.alert("Nastąpił błąd w czasie obliczeń. Odśwież stronę, aby ponownie rozpocząć symulację.");
                options.started = false;
                ws.send(JSON.stringify({a: STOP}));
                return;
            }

            // Aktualizacja wykresów, co zadany interwał czasu
            if(now() - options.lastChartUpdated >= options.updateChart) {
                diagnostics.communicationTimeChart.render();
                diagnostics.delaysChart.render();
                simulationData.chart.render();
                options.lastChartUpdated = now();
            }

            time             += step.get();
            realTime          = receivedTime - startTime;
            diagnostics.delay = parseFloat(realTime - time);
            var newStep       = step.getNew();

            // Jeżeli wyniki symulacji dotarły zbyt szybko, czekamy do końca kroku symulacji
            if(realTime < time) {
                while(realTime < time) {
                    realTime = now() - startTime;
                }
                realTime = simulationData.time + step.get();
            }

            simulationData.time += step.get();
            simulationData.realTime = realTime;
            simulationData.update(stepResults);
            diagnostics.update(receivedTime, data.r[15]);

            // Zatrzymanie symulacji, jeżeli został osiągniety czas końca
            if(simulationParameters.duration != "inf" && realTime >= parseFloat(simulationParameters.duration)*1e3) {
                options.started = false;
                ws.send(JSON.stringify({a: STOP}));
                return;
            }

            // Wysłanie nowego sterownia jeżeli włączone jest użycie predefiniowanych wartości
            if(simulationParameters.usePredefinedControl) {
                options.paramsChanges = setPredefinedControl(time, ws);
            }

            // Jeżeli sterowanie się nie zmieniło, żądanie obliczenia nowego kroku
            if(options.paramsChanges == 0) {
                SendRequest.Simulate(ws, newStep, simulationData.realTime*1e-3);
            }
            return;
        }
        // Obsługa błędów zgłaszanych przez serwer
        if (data["error"]) {
            loading.setIcon("error");
            loading.setMessage(data["code"]);

            if(data.code == 1) {
                setTimeout(function() {
                    loading.setIcon("loading");
                    loading.setMessage("Ponowna próba uruchomienia symulatora...");

                    SendRequest.Setup(ws);
                }, 5000);
            }
            if(data.code == 2) {
                setTimeout(function() {
                    loading.setIcon("loading");
                    loading.setMessage("Ponowna próba uruchomienia symulatora...");

                    SendRequest.Setup(ws);
                }, 1000);
            }

            return;
        }
        // Serwer jest gotowy do wykonywania obliczeń
        if(data.code == 3) {
            options.started = true;

            setTimeout(function(){
                if(simulationParameters.usePredefinedControl) {
                    options.paramsChanges = setPredefinedControl(0, ws);
                }

                if(options.paramsChanges == 0) {
                    var startTime = now();
                    simulationData.startTime = startTime;

                    SendRequest.Simulate(ws, simulationParameters.step, 0, startTime);
                    loading.hide();
                }
            }, 1000);

            return;
        }
        if(data.code == 4) {
            options.paramsChanged++;

            if(options.paramsChanged == options.paramsChanges) {
                options.paramsChanged = 0;
                options.paramsChanges = 0;

                if(simulationData.realTime  == 0) {
                    options.started = true;

                    var startTime = now();
                    simulationData.startTime = startTime;

                    SendRequest.Simulate(ws, simulationParameters.step, 0, startTime);
                    loading.hide();
                } else {
                    SendRequest.Simulate(ws, step.getNew(), simulationData.realTime*1e-3);
                }
            }
            return;
        }
    };

    /**
     * Nawiązanie połączenia z serwerem
     */
    ws.onopen = function () {
        loading.setIcon("loading");
        loading.setMessage('Nawiązano połączenie.<br/>Wysyłanie parametrów symulacji...');

        // Wysłanie żadania ustawienia parametrów symulacji
        SendRequest.Setup(ws);
    };

    /**
     * Zakończenie połączenia z serwerem
     */
    ws.onclose = function (e) {
        ws = {};
        options.started = false;
        loading.setIcon("error");
        loading.setMessage('Symulator nie odpowiada.<br /><a class="btn btn-xs btn-default" href="" onclick="document.location.refresh">Spróbuj połączyć się ponownie</a>');
        loading.show();
    }

    /**
     * Zattrzymanie symulacji
     */
    function stopSimulation(e){
        e.preventDefault();
        options.started = false;
        ws.send(JSON.stringify({a: STOP}));
    }

    /**
     * Zmiana wartości wielkości sterującej
     */
    function setParam(e){
        e.preventDefault();
        var param = $(this).data("param");

        SendRequest.SetParam(ws, param, $('input[data-param="'+param+'"]').val());
    }

    $("body").off("click", '#simStop', stopSimulation);
    $("body").on("click", '#simStop', stopSimulation);
    $("body").off("click", 'button[data-action="setParam"]', setParam);
    $("body").on("click", 'button[data-action="setParam"]', setParam);
};

/**
 * Zmiana parametru wyświetlanego na głównym wykresie
 */
$('#showParameter').change(function(e){
    var value = $(this).val();
    options.activeParam = value;

    simulationData.chart.options.data[0].dataPoints = simData[value];
    simulationData.chart.options.axisY.title = $(this).find('option[value="'+value+'"]').html() + " [" + (options.units[value] ? options.units[value] : ' - ') + "]";
    simulationData.chart.render();
});

/**
 * Zmiana parametru wyświetlanego w kontenerze
 */
$('select[data-action="change-param"]').change(function(e){
    simulationData.boxes.change($(this).data('box'), $(this).val());
});

/**
 * Włączenie / wyłączenie użycia wartości predefiniowanych sterowań
 */
$('#usePredefinedControl').change(function(e){
    if($(this).prop("checked")) {
        simulationParameters.usePredefinedControl = true;
        $('input[data-param="hks"]').prop("disabled", true);
        $('input[data-param="cbor"]').prop("disabled", true);
        $('input[data-param="twe"]').prop("disabled", true);
    } else {
        simulationParameters.usePredefinedControl = false;
        $('input[data-param="hks"]').prop("disabled", false);
        $('input[data-param="cbor"]').prop("disabled", false);
        $('input[data-param="twe"]').prop("disabled", false);
    }
});

// Narysowanie wykresów
diagnostics.communicationTimeChart.render();
diagnostics.delaysChart.render();
simulationData.chart.render();

// Inicjalizacja połączenia z serwerem
initSimulationConnection();
