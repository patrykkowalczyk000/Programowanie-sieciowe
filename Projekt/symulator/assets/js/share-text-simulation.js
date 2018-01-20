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
    // Czy symulacja została uruchomiona
    started       : false
};

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
};


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

    communicationTimeBox    : $('#communicationTime'),
    maxCommunicationTimeBox : $('#maxCommunicationTime'),
    avgCommunicationTimeBox : $('#avgCommunicationTime'),

    // Opóźnienie (ms)
    delay        : 0,
    // Maksymalne opóźnienie (ms)
    maxDelay     : 0,
    // Średnie opóźnienei (ms)
    avgDelay     : 0,
    // Suma wszystkich opóźnień (ms)
    delaysSum    : 0,

    delayBox     : $('#delay'),
    maxDelayBox  : $('#maxDelay'),
    avgDelayBox  : $('#avgDelay'),

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

        this.communicationTimeBox.html(this.communicationTime.toFixed(3));
        this.maxCommunicationTimeBox.html(this.maxCommunicationTime.toFixed(3));
        this.avgCommunicationTimeBox.html(this.avgCommunicationTime.toFixed(3));

        this.delaysSum += (this.delay < 0 ? 0 : this.delay);
        this.avgDelay   = this.delaysSum / this.steps;

        if(this.delay > this.maxDelay){
            this.maxDelay = this.delay;
        }

        this.delayBox.html(this.delay.toFixed(3));
        this.maxDelayBox.html(this.maxDelay.toFixed(3));
        this.avgDelayBox.html(this.avgDelay.toFixed(3));
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
        if(options.started && simulationData.startTime != 0.0){
            var time         = simulationData.time,
                realTime     = simulationData.realTime,
                startTime    = simulationData.startTime,
                receivedTime = now();

            realTime          = receivedTime - startTime;
            time              = parseFloat(data.r[0])*1e3;
            diagnostics.delay = parseFloat(realTime - time);

            // Aktualizacja wyników symulacji
            for(var i in data.r){
                if(i == 0) {
                    continue
                }
                if(i == 14) {
                    $("#param-" + i).html(data.r[i]*1e3);
                } else {
                    $("#param-" + i).html(data.r[i]);
                }
            }

            // Jeżeli wyniki symulacji dotarły zbyt szybko, czekamy do końca kroku symulacji
            if(realTime < time) {
                while(realTime < time) {
                    realTime = now() - startTime;
                }
                // sztuczne ustawienie czasu rzeczywistego, ponieważ
                realTime = simulationData.time + data.r[14]*1e3;
            }
            $("#param-time").html(realTime*1e-3);


            simulationData.time    += data.r[14]*1e3;
            simulationData.realTime = realTime;

            diagnostics.update(receivedTime, data.r[15]);
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

$('select[data-action="change-param"]').change(function(e){
    simulationData.boxes.change($(this).data('box'), $(this).val());
});

// Inicjalizacja połączenia z serwerem
initSimulationConnection();
