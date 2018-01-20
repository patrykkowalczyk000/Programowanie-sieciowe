#include "libraries/uWS.h"
#include "simulation.h"
#include "simulator.h"
#include "libraries/json.hpp"
#include <iostream>
#include <sstream>
#include <list>
#include <string>
#include <vector>
#include <array>
#include <map>
#include <boost/algorithm/string.hpp>
#include <algorithm>

// Akcje obsługiwane przez serwer
const int SETUP        = 1;
const int SIMULATE     = 2;
const int SET_PARAM    = 3;
const int STOP         = 5;

using namespace std;
using json = nlohmann::json;

// Podłączeni goście, który mają link do udostępnionej symulacji
list<uWS::WebSocket<uWS::SERVER>> guests;
// Podłączeni użytkownicy
map<uWS::WebSocket<uWS::SERVER>, map<string,string>> users;
// Symulacja
simulation simulation;


/**
 * Pobiera dane użytkownika
 * @param data
 * @return
 */
map<string, string> getClientData(char* data){
    string headers(data);
    string path;
    vector<std::string> lines;
    vector<std::string> line0;
    vector<std::string> queryParams;
    vector<std::string> param;
    map<string, string> clientData;

    boost::split(lines, headers, boost::is_any_of("\n"));
    boost::split(line0, lines[0], boost::is_any_of(" "));
    path = line0[0].substr(2);
    boost::split(queryParams, path, boost::is_any_of("&"));

    for(std::vector<int>::size_type i = 0; i != queryParams.size(); i++) {
        boost::split(param, queryParams[i], boost::is_any_of("="));
        clientData.insert(pair<string, string>(param[0], param[1]));
    }

    return clientData;
}

int main() {
    // Symulator
    simulator simulator;

    // Odpowiedzi serwera:
    // - Symulator pracuje obecnie nad inną symulacją
    json busyResponse = {
        {"error", true},
        {"code", 1}
    };
    // - Symulator nie jest gotowy, aby rozpocząć obliczenia
    json notReadyResponse = {
        {"error", true},
        {"code", 2}
    };
    // - Symulator jest gotowy rozpocząć obliczenia
    json readyResponse = {
        {"error", false},
        {"code", 3}
    };
    // - Potwierdzenie zmiany wartości wielkości sterującej
    json paramChangedResponse = {
        {"error", false},
        {"code", 4}
    };
    // - Wyniki kroku symulacji
    json stepResultsResponse = {
        {"r", {}}
    };
    // - Informacje o czasie rozpoczęcia symulacji
    json simulationInfoResponse = {
        {"i", {}}
    };

    
    uWS::Hub socket;


    /**
     * Nowa wiadomość otrzymana przez serwer
     * @return 
     */
    socket.onMessage(
        [
            &simulator, &stepResultsResponse,
            &simulationInfoResponse, &busyResponse, &readyResponse, &paramChangedResponse
        ](uWS::WebSocket<uWS::SERVER> ws, char *message, size_t length, uWS::OpCode opCode) {

        string msg(message);
        json data = json::parse(msg.substr(0, length));
        string response = "";
        array<double, 17> stepResults;
        double results[16];
        unsigned int i = 0;
        std::vector<double> res;

        switch((int) data["a"]) {
            // Oblicz nowy krok
            case SIMULATE:
                // Jeżeli symulacja nie została uruchomiona lub użytkownik który
                // prosi o obliczenie kroku nie uruchomił symulacji wiadomość
                // jest ignorowana
                if(!simulation.isStarted() || simulation.userId != users[ws]["userId"]) {
                    return;
                }
                
                // Jeżeli czas startu jest zerowy, to znaczy, że obliczany jest pierwszy krok
                // symulacji, i informacja o starcie symulacji musi być wysłąna do 
                // użytkowników posiadających link do podglądu symulacji
                if(simulation.getStartTime() == 0.0) {
                    simulation.setStartTime((double) data["t"]);
                    simulationInfoResponse["i"] = {simulation.getRefTime(), simulation.getStartTime()};
                    response = simulationInfoResponse.dump();

                    for(auto guestWs = guests.begin(); guestWs != guests.end(); ++guestWs) {
                        uWS::WebSocket<uWS::SERVER> current = *guestWs;

                        if(users[current]["simId"] == simulation.ID)
                            current.send(&response[0], uWS::OpCode::TEXT);
                    }
                }
                
                
                simulator.setStep((double) data["s"]);
                stepResults = simulator.simulate();

                res = std::vector<double>(std::begin(stepResults), std::end(stepResults));

                simulation.saveStepResults(res, (double) data["r"]);

                stepResultsResponse["r"] = {
                    stepResults[0],
                    stepResults[1],
                    stepResults[2],
                    stepResults[3],
                    stepResults[4],
                    stepResults[5],
                    stepResults[6],
                    stepResults[7],
                    stepResults[8],
                    stepResults[9],
                    stepResults[10],
                    stepResults[11],
                    stepResults[12],
                    stepResults[13],
                    stepResults[14],
                    (double) data["t"]
                };
                response = stepResultsResponse.dump();
                ws.send(&response[0], uWS::OpCode::TEXT);
                
                for(auto guestWs = guests.begin(); guestWs != guests.end(); ++guestWs) {
                    uWS::WebSocket<uWS::SERVER> current = *guestWs;

                    if(users[current]["simId"] == simulation.ID)
                        current.send(&response[0], uWS::OpCode::TEXT);
                }
                break;
            // Ustawienie parametrów symulacji
            case SETUP:
                response = busyResponse.dump();

                if(simulation.isStarted()) {
                    ws.send(&response[0], uWS::OpCode::TEXT);
                    return;
                }

                simulation.reset();
                simulation.start();
                simulation.setRefTime((double) data["refTime"]);
                simulation.ID     = users[ws]["simId"];
                simulation.userId = users[ws]["userId"];
                simulation.date   = data["date"];

                simulationInfoResponse["i"] = {simulation.getRefTime(), simulation.getStartTime()};
                response = simulationInfoResponse.dump();

                for(auto guestWs = guests.begin(); guestWs != guests.end(); ++guestWs) {
                    uWS::WebSocket<uWS::SERVER> current = *guestWs;

                    if(users[current]["simId"] == simulation.ID)
                        current.send(&response[0], uWS::OpCode::TEXT);
                }

                simulator.calculateStart();
                simulator.setSimulation();

                response = readyResponse.dump();
                ws.send(&response[0], uWS::OpCode::TEXT);

                cout << "Użytkownik o ID " << users[ws]["userId"] << " ustawił parametry symulacji o ID " << users[ws]["simId"] << endl;

                break;
            // Ustawienie sterowań
            case SET_PARAM:
                if(data["p"] == "hks") {
                    simulator.setHks((double) data["v"]);
                }
                if(data["p"] == "cbor") {
                    simulator.setCbor((double) data["v"]);
                }
                if(data["p"] == "twe") {
                    simulator.setTwe((double) data["v"]);
                }
                response = paramChangedResponse.dump();
                ws.send(&response[0], uWS::OpCode::TEXT);
                break;
            // Zatrzymanie symulacji i zapis wyników
            case STOP:
                simulation.stop();
                simulation.saveResults();
                simulation.reset();
                break;
        }
    });
    
    /**
     * Nowe połączenie z serwerem
     * @return 
     */
    socket.onConnection([&simulationInfoResponse](uWS::WebSocket<uWS::SERVER> ws, uWS::UpgradeInfo ui) {
        map<string, string> clientData = getClientData(ui.path);
        users.insert(pair<uWS::WebSocket<uWS::SERVER>, map<string,string>>(ws, clientData));

        if(clientData["userId"] == "guest") {
            guests.push_back(ws);

            if(clientData["simId"] == simulation.ID && simulation.isStarted()) {
                simulationInfoResponse["i"] = {simulation.getRefTime(), simulation.getStartTime()};
                string response = simulationInfoResponse.dump();
                ws.send(&response[0], uWS::OpCode::TEXT);
            }
            cout << "Gość połączył się z symulatorem, aby obserwować wyniki symulacji od ID " << clientData["simId"] << endl;
        } else {
            cout << "Użytkownik o ID " << clientData["userId"] << " połączył się z symulatorem, aby uruchomić symulację o ID " << clientData["simId"] << endl;
        }
    });
    
    /**
     * Zakończenie połączenia
     * @return 
     */
    socket.onDisconnection([](uWS::WebSocket<uWS::SERVER> ws, int code, char* message, size_t length) {
        if(users[ws]["userId"] == "guest") {
            guests.remove(ws);

            cout << "Gość obserwujący symulację o ID " << users[ws]["simId"] << " zakończył połączenie." << endl;

            users.erase(ws);
            return;
        }
        
        // Jeżeli był to użytkownik, prowadzący symulację następuje jej zakończenie i zapis wyników
        if(users[ws]["userId"] == simulation.userId) {
            simulation.stop();
            simulation.saveResults();
            simulation.reset();
        }

        cout << "Użytkownik od ID " << users[ws]["userId"] << " zakończył połączenie" << endl;

        users.erase(ws);
    });

    socket.listen(8081);


    cout << "Symulator reaktora jądrowego nasłuchuje na porcie 8081" << std::endl << endl;
    socket.run();

    cin.get();
    return 0;
}
