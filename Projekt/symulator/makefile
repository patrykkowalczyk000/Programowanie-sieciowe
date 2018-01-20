database:
	mongod --dbpath=$(PWD)/data/db
http_server:
	node server.js
sim_server:
	./simulation_server/server
install:
	echo "1) Instalacja bazy danych MongoDB"
	sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
	echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
	sudo apt-get update
	sudo apt-get install -y mongodb-org
	echo "2) Instalacja Node.js oraz npm"
	sudo apt-get install nodejs-legacy
	sudo apt-get install npm
	echo "3) Instalacja bibliotek używanych przez serwer HTTP"
	npm install
	echo "Instalacja zakończona pomyślnie!"

