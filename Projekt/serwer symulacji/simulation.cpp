#include "simulation.h"
#include <fstream>
#include <iostream>
#include <sstream>
#include <boost/filesystem.hpp>
#include <boost/algorithm/string/join.hpp>

double simulation::getRefTime() {
    return this->refTime;
}
void simulation::setRefTime(double time) {
    this->refTime = time;
}
double simulation::getStartTime() {
    return this->startTime;
}

void simulation::setStartTime(double time) {
    this->startTime = time;
}

void simulation::start() {
    this->started = true;
}

void simulation::stop() {
    this->started = false;
}

bool simulation::isStarted() {
    return this->started;
}

void simulation::reset() {
    this->ID        = "";
    this->userId    = "";
    this->date = "";
    this->refTime   = 0.0;
    this->startTime = 0.0;
    this->results.clear();
}

void simulation::saveStepResults(std::vector<double> result, double time) {
    if(time == 0) {
        this->results.push_back(result);
    } else {
        this->results[this->results.size() -1].push_back(time);
        this->results.push_back(result);
    }
}

void simulation::saveResults() {
    std::fstream file;
    std::string dirName = boost::filesystem::current_path().string() + "/simulations/" + this->ID;
    std::string fileName = dirName + "/" + this->date + ".csv";
    std::string header[18] = { "sim_T", "s_n_k", "s_Q_k", "s_tp_k", "s_tch_k", "s_ro_k", "rohks", "rom", "roep", "rob", "roxe", "rosm", "ropal", "s_hks_k", "ST", "s_cbor_k", "s_twe", "real_T" };
    
    const char* path = dirName.c_str();
    boost::filesystem::path dir(path);
    boost::filesystem::create_directory(dir);
    
    file.open(fileName, std::fstream::trunc | std::fstream::out);

    file << boost::algorithm::join(header, ",");
    
    for(size_t i = 0; i < this->results.size(); ++i) {
        std::stringstream ss;
        for(size_t j = 0; j < this->results[i].size(); ++j) {
          if(j != 0)
            ss << ",";
          ss << this->results[i][j];
        }
        std::string s = ss.str();
        
        file << "\n" + s;
    }
        
    
    file.close();
    
    std::cout << "Zapisano wyniki symulacji o ID " << this->ID << std::endl;
}


simulation::~simulation() {
}

