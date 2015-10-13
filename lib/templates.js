const dot  = require("dot");
const path = require("path");
const fs   = require("fs");

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

const rootDirectory = (function fpm(m) { return m.parent ? fpm(m.parent) : m; })(module).filename;
const processedTemplates = {};

function listDirectories(base) {
	return fs.readdirSync(base).filter(entry => fs.statSync(path.join(base, entry)).isDirectory());
}

function loadTemplates(base) {
	base = path.resolve(base);

	if (base in processedTemplates) {
		return processedTemplates[base];
	} else {
		const obj = dot.process({path: base});

		listDirectories(base).forEach(function (entry) {
			const tpls = loadTemplates(path.join(base, entry));

			if (entry in obj) {
				for (var k in tpls) {
					obj[entry][k] = tpls[k];
				}
			} else {
				obj[entry] = tpls;
			}
		});

		return processedTemplates[base] = obj;
	}
}

module.exports = loadTemplates(path.join(path.dirname(rootDirectory), "templates"));
module.exports.loadTemplates = loadTemplates;
