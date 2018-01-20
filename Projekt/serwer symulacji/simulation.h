#ifndef SIMULATION_H
#define SIMULATION_H

#include <string>
#include <vector>

class simulation {
public:
    std::string ID;
    std::string userId;
    std::string date;
    std::vector<std::vector<double> > results;
    
    double getRefTime();
    void setRefTime(double time);
    double getStartTime();
    void setStartTime(double time);
    void start();
    void stop();
    bool isStarted();
    void reset();
    void saveStepResults(std::vector<double> result, double time);
    void saveResults();
    virtual ~simulation();
private:
    bool started;
    double refTime;
    double startTime;
    
};

#endif /* SIMULATION_H */

