#
# Generated Makefile - do not edit!
#
# Edit the Makefile in the project folder instead (../Makefile). Each target
# has a -pre and a -post target defined where you can add customized code.
#
# This makefile implements configuration specific macros and targets.


# Environment
MKDIR=mkdir
CP=cp
GREP=grep
NM=nm
CCADMIN=CCadmin
RANLIB=ranlib
CC=gcc
CCC=g++
CXX=g++
FC=gfortran
AS=as

# Macros
CND_PLATFORM=GNU-Linux
CND_DLIB_EXT=so
CND_CONF=Debug
CND_DISTDIR=dist
CND_BUILDDIR=build

# Include project Makefile
include Makefile

# Object Directory
OBJECTDIR=${CND_BUILDDIR}/${CND_CONF}/${CND_PLATFORM}

# Object Files
OBJECTFILES= \
	${OBJECTDIR}/libraries/Extensions.o \
	${OBJECTDIR}/libraries/Group.o \
	${OBJECTDIR}/libraries/HTTPSocket.o \
	${OBJECTDIR}/libraries/Hub.o \
	${OBJECTDIR}/libraries/Networking.o \
	${OBJECTDIR}/libraries/Node.o \
	${OBJECTDIR}/libraries/Socket.o \
	${OBJECTDIR}/libraries/WebSocket.o \
	${OBJECTDIR}/libraries/WebSocketImpl.o \
	${OBJECTDIR}/libraries/uUV.o \
	${OBJECTDIR}/server.o \
	${OBJECTDIR}/simulation.o \
	${OBJECTDIR}/simulator.o


# C Compiler Flags
CFLAGS=

# CC Compiler Flags
CCFLAGS=
CXXFLAGS=

# Fortran Compiler Flags
FFLAGS=

# Assembler Flags
ASFLAGS=

# Link Libraries and Options
LDLIBSOPTIONS=-Llibraries -L/usr/lib -luWS -lssl -lcrypto -luv -luv -lz

# Build Targets
.build-conf: ${BUILD_SUBPROJECTS}
	"${MAKE}"  -f nbproject/Makefile-${CND_CONF}.mk ${CND_DISTDIR}/${CND_CONF}/${CND_PLATFORM}/symulator

${CND_DISTDIR}/${CND_CONF}/${CND_PLATFORM}/symulator: ${OBJECTFILES}
	${MKDIR} -p ${CND_DISTDIR}/${CND_CONF}/${CND_PLATFORM}
	${LINK.cc} -o ${CND_DISTDIR}/${CND_CONF}/${CND_PLATFORM}/symulator ${OBJECTFILES} ${LDLIBSOPTIONS}

${OBJECTDIR}/libraries/Extensions.o: libraries/Extensions.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Extensions.o libraries/Extensions.cpp

${OBJECTDIR}/libraries/Group.o: libraries/Group.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Group.o libraries/Group.cpp

${OBJECTDIR}/libraries/HTTPSocket.o: libraries/HTTPSocket.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/HTTPSocket.o libraries/HTTPSocket.cpp

${OBJECTDIR}/libraries/Hub.o: libraries/Hub.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Hub.o libraries/Hub.cpp

${OBJECTDIR}/libraries/Networking.o: libraries/Networking.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Networking.o libraries/Networking.cpp

${OBJECTDIR}/libraries/Node.o: libraries/Node.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Node.o libraries/Node.cpp

${OBJECTDIR}/libraries/Socket.o: libraries/Socket.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/Socket.o libraries/Socket.cpp

${OBJECTDIR}/libraries/WebSocket.o: libraries/WebSocket.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/WebSocket.o libraries/WebSocket.cpp

${OBJECTDIR}/libraries/WebSocketImpl.o: libraries/WebSocketImpl.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/WebSocketImpl.o libraries/WebSocketImpl.cpp

${OBJECTDIR}/libraries/uUV.o: libraries/uUV.cpp 
	${MKDIR} -p ${OBJECTDIR}/libraries
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/libraries/uUV.o libraries/uUV.cpp

${OBJECTDIR}/server.o: server.cpp 
	${MKDIR} -p ${OBJECTDIR}
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/server.o server.cpp

${OBJECTDIR}/simulation.o: simulation.cpp 
	${MKDIR} -p ${OBJECTDIR}
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/simulation.o simulation.cpp

${OBJECTDIR}/simulator.o: simulator.cpp 
	${MKDIR} -p ${OBJECTDIR}
	${RM} "$@.d"
	$(COMPILE.cc) -g -Ilibraries -I/usr/include -std=c++11 -MMD -MP -MF "$@.d" -o ${OBJECTDIR}/simulator.o simulator.cpp

# Subprojects
.build-subprojects:

# Clean Targets
.clean-conf: ${CLEAN_SUBPROJECTS}
	${RM} -r ${CND_BUILDDIR}/${CND_CONF}
	${RM} ${CND_DISTDIR}/${CND_CONF}/${CND_PLATFORM}/symulator

# Subprojects
.clean-subprojects:

# Enable dependency checking
.dep.inc: .depcheck-impl

include .dep.inc
