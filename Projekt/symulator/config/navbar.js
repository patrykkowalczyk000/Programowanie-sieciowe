module.exports = {
	"left": [
		{
			"slug": "start",
			"url": "/",
			"icon": "ion-ios-home-outline",
			"name": "Start",
            "userGroup": "user"
		},
		{
			"slug": "simulations",
			"url": "/simulations",
			"icon": "ion-ios-paper-outline",
			"name": "Symulacje",
            "userGroup": "user"
		}
	],

	"right": [
		{
			"slug": "information",
			"url": "/information",
			"icon": "ion-ios-information-outline",
			"name": "",
            "userGroup": "guest"
		},
		{
			"slug": "help",
			"url": "/help",
			"icon": "ion-ios-help-outline",
			"name": "",
            "userGroup": "guest"
		},
		{
			"slug": "user",
			"url": "#",
			"icon": "ion-ios-person-outline",
			"name": "",
            "userGroup": "user",
			"dropdown": [
				{
					"slug": "your-profile",
					"url": "/profile",
					"icon": "ion-ios-person",
					"name": "Twój profil",
                    "userGroup": "user"
				},
				{
					"type": "separator",
                    "userGroup": "user"
				},
                {
					"slug": "users",
					"url": "users",
					"icon": "ion-ios-people-outline",
					"name": "Zarządzaj użytkownikami",
                    "userGroup": "admin"
				},
				{
					"type": "separator",
                    "userGroup": "admin"
				},
				{
					"slug": "logout",
					"url": "/logout",
					"icon": "ion-ios-unlocked-outline",
					"name": "Wyloguj się",
                    "userGroup": "user"
				}
			]
		},
	]
};
