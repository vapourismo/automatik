var dot = require("dot");

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

module.exports = dot.process({path: "src/views"});
module.exports.boxes = dot.process({path: "src/views/boxes"})
