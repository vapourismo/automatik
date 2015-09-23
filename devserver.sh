#!/bin/sh

PIDFILE=".devserver.pid"
LAUNCHCMD="env NODE_PATH=lib node --harmony src/automatik.js"

start_server() {
	$LAUNCHCMD &
	echo $! > $PIDFILE
}

restart_server() {
	kill $(< $PIDFILE)
	start_server
}

[[ -e $PIDFILE ]] && restart_server || start_server
