var mongoose = require('mongoose');

// define the schema for our user model
var simulationSchema = mongoose.Schema({
    _creator : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // ID użytkownika, który utworzył symulację
	name: String,                                                       // Nazwa sumulacji
	description: String,                                                // Opis symulacji
	lastSimulated: Date,                                                // Data ostatniej wykonanej symulacji
    parameters: {                                                       // Parametry symulacji:
        duration: {type: String, default: ""},                              // Czas trwania symulacji [s]
        step: {type: Number, default: ""},                                  // Krok symulacji [ms]
    },
    usePredefinedControl: {type: Boolean, default: false},                 // Czy użyć predefiniowanych wartości sterowań
    predefinedControl: {                                                // Predefiniowane sterowania
        hks: [ {
            x: {type: Number, default: ""},
            y: {type: Number, default: ""}
        }],                                                           // Położenie prętów paliwowaych
        twe: [ {
            x: {type: Number, default: ""},
            y: {type: Number, default: ""}
        }],                                  // Temperatura chłodziwa na wejściu do reaktora
        cbor: [ {
            x: {type: Number, default: ""},
            y: {type: Number, default: ""}
        }]                                 // Stężenie kwasu borowego
    }
});


// create the model for users and expose it to our app
module.exports = mongoose.model('Simulation', simulationSchema);
