var dot = require("dot");
var path = require("path");
var fs = require("fs");

dot.templateSettings = {
	evaluate:      /<%([\s\S]+?)%>/g,
	interpolate:   /<%=([\s\S]+?)%>/g,
	encode:        /<%!([\s\S]+?)%>/g,
	use:           /<%#([\s\S]+?)%>/g,
	define:        /<%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#%>/g,
	conditional:   /<%\?(\?)?\s*([\s\S]*?)\s*%>/g,
	iterate:       /<%~\s*(?:%>|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*%>)/g,
	varname:       'data',
	strip:         true,
	append:        true,
	selfcontained: false
};

const processedTemplates = {};

function listDirectories(base) {
	return fs.readdirSync(base).filter(entry => fs.statSync(path.join(base, entry)).isDirectory());
}

function loadTemplates(base) {
	base = path.resolve(base);

	if (base in processedTemplates) {
		return processedTemplates[base];
	} else {
		var obj = dot.process({path: base});

		listDirectories(base).forEach(function (entry) {
			obj[entry] = loadTemplates(path.join(base, entry));
		});

		return processedTemplates[base] = obj;
	}
}

module.exports = loadTemplates(path.join(path.dirname(module.filename), "templates"));
module.exports.loadTemplates = loadTemplates;
