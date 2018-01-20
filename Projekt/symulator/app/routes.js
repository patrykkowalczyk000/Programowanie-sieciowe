var fs = require('fs');
var User = require('../app/models/user');
var Simulation = require('../app/models/simulation');
var path = require('path');
var mime = require('mime');
var archiver = require('archiver');

module.exports = function(app, passport) {

    /**
     * Strona główna symulatora
     */
    app.get('/', isLoggedIn, function(req, res) {
		var data = {
            userGroup: req.user.group,
			navbarActive: "start",
			message: req.flash('simulationMessage'),
			simulations: []
		};

		Simulation
			.find({ _creator: req.user._id })
			.sort({lastSimulated: "desc"})
			.limit(5)
			.exec(function (err, simulations) {
				if (err) {
					data.message = "Wystąpił błąd w czasie pobieranie listy ostatnich symulacji.";
				}

                for(i in simulations) {
                    if(simulations[i].lastSimulated != undefined) {
                        data.simulations.push(simulations[i]);
                    }
                }

				res.render('index.ejs', data);
			});
	});

    /**
     * Lista symulacji
     */
	app.get('/simulations', isLoggedIn, function(req, res) {
		var data = {
            userGroup: req.user.group,
			navbarActive: "simulations",
			message: req.flash('simulationMessage'),
            redirectTo: req.url,
			simulations: [],
			simulation: false
		};

		Simulation
			.find({ _creator: req.user._id })
			.sort({name: "asc"})
			.exec(function (err, simulations) {
				if (err) {
					data.message = "Wystąpił błąd w czasie pobieranie listy symulacji.";
				}

				data.simulations = simulations;

				res.render('simulations.ejs', data);
			});
	});

    /**
     * Usunięcie symulacji
     */
    app.get('/simulation/delete/:id', isLoggedIn, function(req, res) {
		Simulation.find({_id: req.params.id}).remove().exec();

        req.flash('simulationMessage', 'Symulacja została usunięta pomyślnie.');
        res.redirect('/simulations');
	});

    /**
     * Uruchomienie symulatora dla symulacji
     */
    app.get('/new-simulation/:id', isLoggedIn, function(req, res) {
        var lastSimulationDate = new Date();

		var data = {
            userGroup: req.user.group,
			navbarActive: "new-simulation",
			message: req.flash('simulationMessage'),
            redirectTo: req.url,
			simulation: false,
            lastSimulated: lastSimulationDate.toLocaleString().replace(/\.|:/g, "-").replace(",", " ")
		};


        Simulation.update(
			{
				_id: req.params.id
			},
			{
				lastSimulated: lastSimulationDate
			},
			function(err) {
				if(err) {
					console.log(err);
					req.flash('simulationMessage', 'Nie udało się zaktualizować danych.');
				}
				Simulation
                    .findOne({ _id: req.params.id })
                    .exec(function (err, simulation) {
                        if (err) {
                            req.flash('simulationMessage', 'Wystąpił błąd w czasie pobieranie aktywnej symulacji.');
                        }

                        data.simulation = simulation;

                        res.render('new-simulation.ejs', data);
                    });
			}
		);
	});

    /**
     * Uruchomienie symulatora dla symulacji w trybie tekstowym
     */
    app.get('/new-simulation/:id/text', isLoggedIn, function(req, res) {
        var lastSimulationDate = new Date();

		var data = {
            userGroup: req.user.group,
			navbarActive: "new-text-simulation",
			message: req.flash('simulationMessage'),
            redirectTo: req.url,
			simulation: false,
            lastSimulated: lastSimulationDate.toLocaleString().replace(/\.|:/g, "-").replace(",", " ")
		};


        Simulation.update(
			{
				_id: req.params.id
			},
			{
				lastSimulated: lastSimulationDate
			},
			function(err) {
				if(err) {
					console.log(err);
					req.flash('simulationMessage', 'Nie udało się zaktualizować danych.');
				}
				Simulation
                    .findOne({ _id: req.params.id })
                    .exec(function (err, simulation) {
                        if (err) {
                            req.flash('simulationMessage', 'Wystąpił błąd w czasie pobieranie aktywnej symulacji.');
                        }

                        data.simulation = simulation;

                        res.render('new-text-simulation.ejs', data);
                    });
			}
		);
	});


    /**
     * Wyświetlanie parametrów symulacji
     */
	app.get('/simulation/:id', isLoggedIn, function(req, res) {
        var file;
		var data = {
            userGroup: req.user.group,
			navbarActive: "simulations",
			message: req.flash('simulationMessage'),
            redirectTo: req.url,
			simulations: [],
            results: [],
			simulation: false
		};

        try {
            data.results = fs.readdirSync('./simulations/' + req.params.id);
            for(file in data.results) {
                data.results[file] = data.results[file].replace(".csv", "");
            }
        } catch(err) {
            console.log(err);
            data.message = 'Nie udało się pobrać wyników symulacji.';
        }

		Simulation
			.find({ _creator: req.user._id })
			.sort({name: "asc"})
			.exec(function (err, simulations) {
				if (err) {
					data.message = "Wystąpił błąd w czasie pobieranie listy symulacji.";
				}

				data.simulations = simulations;

				Simulation
					.findOne({ _id: req.params.id })
					.exec(function (err, simulation) {
						if (err) {
							data.message = "Wystąpił błąd w czasie pobieranie aktywnej symulacji.";
						}

						data.simulation = simulation;

						res.render('simulations.ejs', data);
					});
			});
	});


    /**
     * Edycja nazwy i opisu symulacji
     */
	app.post('/simulation/edit', isLoggedIn, function(req, res) {
		Simulation.update(
			{
				_id: req.body.id
			},
			{
				name: req.body.name,
				description: req.body.description
			},
			function(err) {
				if(err) {
					console.log(err);
					req.flash('simulationMessage', 'Nie udało się zaktualizować danych.');
				}
				res.redirect('/simulation/'+req.body.id);
			}
		);
	});

    /**
     * Edycja parametrów symulacji
     */
    app.post('/simulation/editParameters', isLoggedIn, function(req, res) {
        var i,
            hks  = [],
            twe  = [],
            cbor = [];

        if (req.body.hks != undefined) {
            for(i in req.body.hks.time) {
                hks.push({"x": req.body.hks.time[i], "y": req.body.hks.value[i]});
            }
        }
        if (req.body.twe != undefined) {
            for(i in req.body.twe.time) {
                twe.push({"x": req.body.twe.time[i], "y": req.body.twe.value[i]});
            }
        }
        if (req.body.cbor != undefined) {
            for(i in req.body.cbor.time) {
                cbor.push({"x": req.body.cbor.time[i], "y": req.body.cbor.value[i]});
            }
        }

		Simulation.update(
			{
				_id: req.body.id
			},
			{
				parameters: {
                    duration: req.body.duration,
                    step: req.body.step,
                },
                predefinedControl: {
                    "hks"  : hks,
                    "twe"  : twe,
                    "cbor" : cbor
                },
                usePredefinedControl: (req.body.usePredefinedControl == 1 ? true : false)
			},
			function(err) {
				if(err) {
					console.log(err);
					req.flash('simulationMessage', 'Nie udało się zaktualizować danych.');
				}
				res.redirect('/simulation/'+req.body.id);
			}
		);
	});

    /**
     * Utworzenie nowej symulacji
     */
    app.post('/simulation/add', isLoggedIn, function(req, res) {
        var sim = new Simulation(),
            params,
            defaults = {
                parameters: {
                    duration: 60,
                    step: 20
                },
                predefinedControl: {
                    hks: [
                        {x : 0,  y : 175},
                        {x : 60, y : 175}
                    ],
                    cbor: [
                        {x : 0,  y : 5.95},
                        {x : 60, y : 5.95}
                    ],
                    twe: [
                        {x : 0,  y : 269},
                        {x : 60, y : 269}
                    ]
                }
            };

        sim._creator = req.user._id;
        sim.name = req.body.name;
        sim.description = req.body.description;
        sim.parameters = defaults.parameters;
        sim.predefinedControl = defaults.predefinedControl;

        if(sim.name == "" || sim.description == "") {
            req.flash('simulationMessage', 'Symulacja nie została utworzona. Podaj nazwę i opis symulacji.');
            res.redirect('/simulations');
            return;
        }

        if(req.files.parameters.originalFilename) {
            try {
                data = JSON.parse(fs.readFileSync(req.files.parameters.path));

                if(data.hasOwnProperty("parameters")) {
                    sim.parameters = data.parameters;
                }
                if(data.hasOwnProperty("predefinedControl")) {
                    sim.predefinedControl = data.predefinedControl;
                }
            } catch(err) {
                req.flash('simulationMessage', 'Plik z parametrami symulacji zwiera błędy. Popraw je, a następnie spróbuj ponownie utworzyć nową symulację.');
                res.redirect(req.body.redirect);
                return;
            }

        }

        sim.save(function(err, simulation) {
            if(err) {
                req.flash('simulationMessage', 'Nie udało się utworzyć symulacji.');
            }

            try {
                fs.mkdirSync('./simulations/' + simulation._id);
            } catch(err) {
                Simulation.find({_id: simulation._id}).remove().exec();

                req.flash('simulationMessage', 'Nie udało się utworzyć katalogu na wyniki symulacji. Symulacja nie została utworzona.');
            }

            res.redirect('/simulation/'+simulation._id);
        });
    });

    /**
     * Import symulacji z pliku
     */
    app.post('/simulation/import', isLoggedIn, function(req, res) {
        var sim = new Simulation(),
            params;

        sim._creator = req.user._id;

        if(req.files.simulation.originalFilename != "") {
            try {
                data = JSON.parse(fs.readFileSync(req.files.simulation.path));
                if(!data.hasOwnProperty("name") || !data.hasOwnProperty("description")) {
                    req.flash('simulationMessage', 'Plik z danymi symulacji musi zawierać przynajmniej jej nazwę i opis.');
                    res.redirect(req.body.redirect);
                    return;
                }
                sim.name = data.name;
                sim.description = data.description;
                if(data.hasOwnProperty("duration")) {
                    sim.duration = data.duration;
                }
                if(data.hasOwnProperty("step")) {
                    sim.step = data.step;
                }
                if(data.hasOwnProperty("parameters")) {
                    sim.parameters = data.parameters;
                }
                if(data.hasOwnProperty("predefinedControl")) {
                    sim.predefinedControl = data.predefinedControl;
                }
            } catch(err) {
                req.flash('simulationMessage', 'Plik z parametrami symulacji zwiera błędy. Popraw je, a następnie spróbuj ponownie importować dane symulacji.');
                res.redirect(req.body.redirect);
                return;
            }

            sim.save(function(err, simulation) {
                if(err) {
                    req.flash('simulationMessage', 'Nie udało się utworzyć symulacji.');
                }

                try {
                    fs.mkdirSync('./simulations/' + simulation._id);
                } catch(err) {
                    Simulation.find({_id: simulation._id}).remove().exec();

                    req.flash('simulationMessage', 'Nie udało się utworzyć katalogu na wyniki symulacji. Symulacja nie została utworzona.');
                }

                res.redirect('/simulation/'+simulation._id);
            });

        } else {
            req.flash('simulationMessage', 'Nie wybrano pliku z danymi symulacji.');
            res.redirect(req.body.redirect);
        }


    });

    /**
     * Export szablonu symulacji do pliku
     */
    app.get('/export-simulation/:id', isLoggedIn, function(req, res) {
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    res.status(500);
                    res.end();
                }

                res.attachment(simulation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".json");

                function replacer(key, value) {
                    if(key == "_id" || key == "__v" || key == "_creator") {
                        return undefined;
                    }

                    return value;
                }

                res.send(JSON.stringify(simulation, replacer, "  "));
            });
    });

    /**
     * Export parametrów symulacji do pliku
     */
    app.get('/export-simulation-parameters/:id', isLoggedIn, function(req, res) {
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    res.status(500);
                    res.end();
                }

                res.attachment("parametry_symulacji_" + simulation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".json");

                function replacer(key, value) {
                    if(key == "_id" || key == "__v" || key == "_creator") {
                        return undefined;
                    }

                    return value;
                }

                var params = {
                    parameters: simulation.parameters,
                    predefinedControl: simulation.predefinedControl
                };

                res.send(JSON.stringify(params, replacer, "  "));
            });
    });

    /**
     * Import parametrów symulacji z pliku
     */
    app.post('/import-simulation-parameters/:id', isLoggedIn, function(req, res) {
        var newParameters,
            newPredefinedControl;

        if(req.files.parameters.originalFilename) {
            try {
                data = JSON.parse(fs.readFileSync(req.files.parameters.path));

                if(data.hasOwnProperty("parameters")) {
                    newParameters = data.parameters;
                }
                if(data.hasOwnProperty("predefinedControl")) {
                    newPredefinedControl = data.predefinedControl;
                }
            } catch(err) {
                req.flash('simulationMessage', 'Plik z parametrami symulacji zwiera błędy. Popraw je, a następnie spróbuj ponownie utworzyć nową symulację.');
                res.redirect(req.body.redirect);
                return;
            }
        } else {
            req.flash('simulationMessage', 'Nie wybrano pliku z parametrami symulacji.');
            res.redirect(req.body.redirect);
        }


        Simulation.update(
            {
                _id: req.body.id
            },
            {
                parameters: newParameters,
                predefinedControl: newPredefinedControl
            },
            function(err) {
                if(err) {
                    console.log(err);
                    req.flash('simulationMessage', 'Nie udało się zaktualizować danych.');
                }
                res.redirect(req.body.redirect);
            }
        );
    });


    /**
     * Wyświetlenie profilu użuytkownika
     */
	app.get('/profile', isLoggedIn, function(req, res) {
		User
			.findOne({_id: req.user._id})
			.exec(function (err, user) {
				var data = {
                    userGroup: req.user.group,
					navbarActive: 'profile',
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					message: req.flash('profileMessage')
				}

				if (err) {
					data.message = "Wystąpił błąd w czasie pobieranie listy symulacji.";
				}

				res.render('profile.ejs', data);
			});
	});

    /**
     * Pobieranie wyniku symulacji
     */
    app.get('/get-results/:id/:filename', isLoggedIn, function(req, res){
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    res.status(500).end();
                }

                var file = "./simulations/"+req.params.id+"/"+req.params.filename + ".csv";

                var filename = simulation.name + " z " + path.basename(file);
                var mimetype = mime.lookup(file);

                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                res.setHeader('Content-type', mimetype);

                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
        });
    });

    /**
     * Pobiera wszystkie wyniki symulacji spakowane w zipie
     */
    app.get('/get-all-results/:id', isLoggedIn, function(req, res){
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    res.status(500).end();
                }
                var path    = './simulations/' + req.params.id;
                var archive = archiver('zip');

                archive.on('error', function(err) {
                    res.status(500).end();
                });


                res.attachment("Wszystkie wyniki - " + simulation.name + ".zip");

                //this is the streaming magic
                archive.pipe(res);

                archive.directory(path, path.replace(path, ""));

                archive.finalize();
        });
    });

    /**
     * Udostępnianie symulacji
     */
    app.get('/share/:id', function(req, res){
        var data = {
            userGroup: "guest",
			navbarActive: "share",
			message: req.flash('shareMessage'),
			simulation: false,
		};
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    req.flash('shareMessage', 'Wystąpił błąd w czasie pobieranie informacji o symulacji.');
                }

                data.simulation = simulation;

                res.render("share.ejs", data);
            });
    });

    /**
     * Udostępnianie symulacji z tekstowym podglądem danych
     */
    app.get('/share/:id/text', function(req, res){
        var data = {
            userGroup: "guest",
			navbarActive: "share-text",
			message: req.flash('shareMessage'),
			simulation: false,
		};
        Simulation
            .findOne({ _id: req.params.id })
            .exec(function (err, simulation) {
                if (err) {
                    req.flash('shareMessage', 'Wystąpił błąd w czasie pobieranie informacji o symulacji.');
                }

                data.simulation = simulation;

                res.render("share-text.ejs", data);
            });
    });


    /**
     * Edycja danych użytkownika
     */
	app.post('/profile/save', isLoggedIn, function(req, res) {
		User.update(
			{
				_id: req.user._id
			},
			{
				firstName: req.body.firstName,
				lastName: req.body.lastName
			},
			function(err) {
				if(err) {
					req.flash('profileMessage', 'Nie udało się zaktualizować danych.');
				}
				res.redirect('/profile');
			}
		);
	});

    /**
     * Zmiana hasła
     */
	app.post('/profile/changePassword', isLoggedIn, function(req, res) {
		User.findOne({_id: req.user._id}).exec(function(err, user) {
			if(err) {
				req.flash('profileMessage', 'Wystąpił błąd podczas próby zmiany hasła i nie zostało ono zmienione.');
				res.redirect('/profile');
			}

			if (!user.validPassword(req.body.oldPassword)) {
				req.flash('profileMessage', 'Podane hasło nie jest aktualnym hasłem.');
				res.redirect('/profile');
			}

			User.update(
				{
					_id: req.user._id
				},
				{
					password: user.generateHash(req.body.newPassword),
				},
				function(err) {
					if(err) {
						req.flash('profileMessage', 'Nie udało się zmienić hasła.');
					}
					req.flash('profileMessage', 'Hasło zostało zmienione.');
					res.redirect('/profile');
				}
			);
		});
	});

    /**
     * Wyświetlenie informacji o aplikacji
     */
	app.get('/information', function(req, res) {
		res.render('information.ejs', {navbarActive: "information", userGroup: "guest"});
	});

    /**
     * Wyświetlenie pomocy aplikacji
     */
	app.get('/help', function(req, res) {
		res.render('help.ejs', {navbarActive: "help", userGroup: "guest"});
	});

    /**
     * Ekran logowania
     */
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage'), navbarActive: null });
	});

    /**
     * Sprawdzenie poporawności danych do logowania
     */
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/',
		failureRedirect : '/login',
        //successReturnToOrRedirect: true,
		failureFlash : true
	}));

	// TODO: usunąć na produkcji

	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// TODO: usunąć na produkcji
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

    /**
     * Wylogowanie użytkownika
     */
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/login');
	});

    /**
     * Zarządzanie użytkownikami
     */
	app.get('/users', isLoggedIn, function(req, res) {
		var data = {
            userGroup: req.user.group,
			navbarActive: "users",
			message: req.flash('userMessage'),
            redirectTo: req.url,
			users: []
		};

		User
			.find({})
			.sort({name: "asc"})
			.exec(function (err, users) {
				if (err) {
					data.message = "Wystąpił błąd w czasie pobieranie listy użytkownikóœ.";
				}

				data.users = users;

				res.render('users.ejs', data);
			});
	});

    /**
     * Usunięcie użytkownika
     */
    app.get('/user/delete/:id', isLoggedIn, function(req, res) {
		User.find({_id: req.params.id}).remove().exec();
        Simulation.find({_creator: req.params.id}).remove().exec();
        req.flash('userMessage', 'Użytkownik został usunięty pomyślnie.');
        res.redirect('/users');
	});

    /**
     * Uruchomienie symulatora dla symulacji
     */
    app.post('/user/add', isLoggedIn, function(req, res) {
        var user = new User();

        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.email = req.body.email;
        user.group = req.body.group;

        if(user.firstName == "" || user.lastName == "" || user.email == "" || req.body.password == "" || user.group == "") {
            req.flash('userMessage', 'Użytkownik nie został utworzony, ponieważ nie podano wszystkich danych.');
            res.redirect('/users');
            return;
        }

        user.password = user.generateHash(req.body.password);

        user.save(function(err, user) {
            if(err) {
                req.flash('userMessage', 'Nie udało się utworzyć nowego użytkownika.');
            }


            res.redirect('/users');
        });
	});
};

/**
 * Middleware sprawdzające, czy użytkownik jest zalogowany
 */
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
    }
    req.session.redirectTo = req.url;
	res.redirect('/login');
}
