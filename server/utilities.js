var fs     = require("fs");
var path   = require("path");
var config = require("./config");

/*
 * Generators
 */

var GeneratorProto = (function* () {}).__proto__;

function serve(iterator, input, accept, reject) {
	try {
		var step = iterator.next(input);

		if (step.done) {
			accept(step.value);
		} else {
			step.value.then(
				value => serve(iterator, value, accept, reject),
				error => reject(error)
			);
		}
	} catch (error) {
		reject(error);
	}
}

GeneratorProto.promise = function (...args) {
	return new Promise((accept, reject) => serve(this(...args), undefined, accept, reject));
};

GeneratorProto.async = function () {
	return (...args) => this.promise(...args);
};

/*
 * Files
 */

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

/*
 * Logging
 */

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

function debugColor(tag, ...msg) {
	console.log("\033[35mD\033[0m", "\033[34m[" + tag + "]\033[0m", ...msg);
}

function debugPlain(tag, ...msg) {
	console.log("D [" + tag + "]", ...msg);
}

// Decide which loggers shall be used
var loggers = config.colorLogging ? {error: errorColor, warn: warnColor, inform: informColor, debug: debugColor}
                                  : {error: errorPlain, warn: warnPlain, inform: informPlain, debug: debugPlain};

function abort(tag, msg) {
	loggers.error(tag, msg);
	process.exit(1);
}

/*
 * Exports
 */

module.exports = {
	iterateFiles: iterateFiles,
	abort:        abort,
	inform:       loggers.inform,
	warn:         loggers.warn,
	error:        loggers.error,
	debug:        loggers.debug
};
