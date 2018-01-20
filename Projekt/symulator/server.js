/**
 * Serwer
 *
 * Główny plik aplikacji odpowiadający za utworzenie serwera HTTP
 * oraz konfigurację aplikacji.
 */
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var moment   = require('moment');
var async    = require('async');
var configDb = require('./config/database.js');

// Połączenie z bazą danych
mongoose.connect(configDb.url);

require('./config/passport')(passport);

app.configure(function() {
    app.use(express.logger('dev'))
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.set('view engine', 'ejs');

    app.use(express.session({
        secret: 'ilovescotchscotchyscotchscotch',
      }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
});

app.locals = ({
    "navbar": require('./config/navbar'),
    "moment": moment,
    "siteUrl": "http://192.168.0.241:" + port,
    "haveAccess": function(userGroup, access) {
        switch(access) {
            case "guest":
                return true;
                break;
            case "user":
                if(userGroup == "user" || userGroup == "admin") {
                    return true;
                }
                break;
            case "admin":
                if(userGroup == "admin") {
                    return true;
                }
                break;
        }

        return false;

    }
});

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.use('/assets', express.static('assets'));
app.listen(port);
console.log('Serwer został uruchomiony na porcie ' + port);
