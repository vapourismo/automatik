var fs = require("fs");
var path = require("path");

var config = require("./config");

function iterateFiles(base, callback) {
	fs.readdirSync(base).forEach(function (entry) {
		entry = path.join(base, entry);
		var stat = fs.statSync(entry);

		if (stat.isFile()) {
			callback(entry);
		} else if (stat.isDirectory()) {
			iterateFiles(entry, callback);
		}
	});
}

function informColor(tag, ...msg) {
	console.log("\033[32mI\033[0m", "\033[34m[" + tag + "]\033[0m", ...msg);
}

function informPlain(tag, ...msg) {
	console.log("I [" + tag + "]", ...msg);
}

function warnColor(tag, ...msg) {
	console.warn("\033[33mW\033[0m", "\033[34m[" + tag + "]\033[0m", ...msg);
}

function warnPlain(tag, ...msg) {
	console.warn("W [" + tag + "]", ...msg);
}

function errorColor(tag, ...msg) {
	console.error("\033[31mE\033[0m", "\033[34m[" + tag + "]\033[0m", ...msg);
}

function errorPlain(tag, ...msg) {
	console.error("E [" + tag + "]", ...msg);
}

// Decide which loggers shall be used
var loggers = config.colorLogging ? {error: errorColor, warn: warnColor, inform: informColor}
                                  : {error: errorPlain, warn: warnPlain, inform: informPlain};

function abort(tag, msg) {
	loggers.error(tag, msg);
	process.exit(1);
}

module.exports = {
	iterateFiles: iterateFiles,
	abort:        abort,
	inform:       loggers.inform,
	warn:         loggers.warn,
	error:        loggers.error
};
