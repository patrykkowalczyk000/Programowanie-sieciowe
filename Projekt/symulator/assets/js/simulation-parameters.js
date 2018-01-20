(function($, predefinedControl, duration) {
    var template = {
        hks:  $("#hks-template"),
        twe:  $("#twe-template"),
        cbor: $("#cbor-template"),
    },

    items = {
        hks:  $(".predefined-hks-items"),
        twe:  $(".predefined-twe-items"),
        cbor: $(".predefined-cbor-items"),
    },

    predefined = {
        hks:  [],
        twe:  [],
        cbor: [],
    },

    chartData =  predefinedControl;

    var chart =  {
        hks: new CanvasJS.Chart("hksChart", {
            zoomEnabled: true,

            axisY: {
                minimum: 0,
                title: "Położenie prętów paliwowych [cm]",
                titleFontSize: 13
            },
            axisX: {
                minimum: 0,
                viewportMinimum: 0,
                viewportMaximum: duration,
                title: "Czas [s]",
                titleFontSize: 13
            },
            data: [
                {
                    type: "stepLine",
                    dataPoints: chartData.hks
                }
            ]
        }),
        cbor: new CanvasJS.Chart("cborChart", {
            zoomEnabled: true,

            axisY: {
                minimum: 0,
                title: "Stężenie kwasu borowego [g/kg]",
                titleFontSize: 13
            },
            axisX: {
                minimum: 0,
                viewportMinimum: 0,
                viewportMaximum: duration,
                title: "Czas [s]",
                titleFontSize: 13
            },
            data: [
                {
                    type: "stepLine",
                    dataPoints: chartData.cbor
                }
            ]
        }),
        twe: new CanvasJS.Chart("tweChart", {
            zoomEnabled: true,

            axisY: {
                minimum: 0,
                title: "Temperatura chłodziwa na wejściu do reaktora [° C]",
                titleFontSize: 13
            },
            axisX: {
                minimum: 0,
                viewportMinimum: 0,
                viewportMaximum: duration,
                title: "Czas [s]",
                titleFontSize: 13
            },
            data: [
                {
                    type: "stepLine",
                    dataPoints: chartData.twe
                }
            ]
        }),
    };

    $('button[data-action="add-item"]').click(function(e){
        e.preventDefault();
        var variable = $(this).data('var');

        var item = template[variable].clone();

        item.find("input").prop("disabled", false);
        item.attr("id", "");

        items[variable].append(item);
        item.removeClass("hidden");
        item.addClass('predefined-' + variable);
    });

    $('body').on('click', 'a[data-action="remove-item"]', function(e) {
        e.preventDefault();

        var variable = $(this).data('var');

        $(this).parent().remove();

        parseItemsIntoChartData(variable);
    })

    $('body').on('change', '.predefined-hks-items input[type="text"]', function(e){
        parseItemsIntoChartData('hks');
    });
    $('body').on('change', '.predefined-twe-items input[type="text"]', function(e){
        parseItemsIntoChartData('twe');
    });
    $('body').on('change', '.predefined-cbor-items input[type="text"]', function(e){
        parseItemsIntoChartData('cbor');
    });

    $('#duration').change(function(e) {
        chart.hks.options.axisX.viewportMaximum  = parseFloat($(this).val());
        chart.twe.options.axisX.viewportMaximum  = parseFloat($(this).val());
        chart.cbor.options.axisX.viewportMaximum = parseFloat($(this).val());

        chart.hks.render();
        chart.twe.render();
        chart.cbor.render();
    });

    /**
     * Zamienia tablicę utworzoną przez użytkownika na dane do utworzenia wykresu
     *
     * @param   string  variable    Nazwa zmiennej
     */
    function parseItemsIntoChartData(variable) {

        var item = {},
            i = 0,
            sortedKeys;

        $('.predefined-' + variable).each(function(i){
            var time = $(this).find('.time').val() == "" ? 0.0 : $(this).find('.time').val().replace(/,/g, '.'), // zabezpiecyc przez Nan,
                value = $(this).find('.value').val() == "" ? 0.0 : $(this).find('.value').val().replace(/,/g, '.');

            item[time] = {x: parseFloat(time), y: parseFloat(value)};
        });

        sortedKeys = Object.keys(item).sort(function(a, b) {
            return item[a] - item[b]
        });

        chartData[variable] = [];

        for(i in sortedKeys) {
            chartData[variable].push(item[sortedKeys[i]]);
        }

        chart[variable].options.data[0].dataPoints = chartData[variable];
        chart[variable].render();
    }



/**
 * Pokazuje / ukrywa ustawienia predefiniowanego sterowania
 */
$('#real-time-delays').on('switchChange.bootstrapSwitch', function(event, state) {
    if (state) {
        $('#predefined-control').hide();
    } else {
        $('#predefined-control').show();
    }
});
$('#modal-tabs a').click(function (e) {
    console.log('is');
  e.preventDefault();
console.log($("#actsimform").val(), $(this).data("form"), 2);
    $("#actsimform").val($(this).data("form"));
  $(this).tab('show');

});
$("#import-simulation-parameters").click(function(e){
    e.preventDefault();

    $("#import-simulation-parameters-file").click();
});


chart['hks'].render();
chart['twe'].render();
chart['cbor'].render();

})(jQuery, predefinedControls, duration);
