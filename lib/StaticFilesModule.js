var Module = require("webpack/lib/Module");
var RawSource = require("webpack-core/lib/RawSource");

function StaticFilesModule(context, dependencies, name) {
	Module.call(this);
	this.context = context;
	this.dependencies = dependencies;
	this.name = name;
	this.built = false;
	this.cacheable = true;
}
module.exports = StaticFilesModule;

StaticFilesModule.prototype = Object.create(Module.prototype);

StaticFilesModule.prototype.identifier = function() {
	return "staticfiles " + this.name;
};

StaticFilesModule.prototype.readableIdentifier = function() {
	return "staticfiles " + this.name;
};

StaticFilesModule.prototype.disconnect = function disconnect() {
	this.built = false;
	Module.prototype.disconnect.call(this);
};

StaticFilesModule.prototype.needRebuild = function(fileTimestamps, contextTimestamps) {
	var ts = contextTimestamps[this.context];
	if(!ts) return true;
	return ts >= this.builtTime;
};

StaticFilesModule.prototype.build = function build(options, compilation, resolver, fs, callback) {
	this.built = true;
	this.builtTime = new Date().getTime();
	return callback();
};

StaticFilesModule.prototype.source = function(dependencyTemplates, outputOptions) {
	var str = [];
	this.dependencies.forEach(function(dep, idx) {
		if(dep.module) {
			if(idx === this.dependencies.length - 1)
				str.push("module.exports = ");
			str.push("__webpack_require__(");
			if(outputOptions.pathinfo)
				str.push("/*! " + dep.request + " */");
			str.push("" + JSON.stringify(dep.module.id));
			str.push(")");
		} else {
			str.push("(function webpackMissingModule() { throw new Error(");
			str.push(JSON.stringify("Cannot find module \"" + dep.request + "\""));
			str.push("); }())");
		}
		str.push(";\n");
	}, this);
	return new RawSource(str.join(""));
};

StaticFilesModule.prototype.size = function() {
	return 16 + this.dependencies.length * 12;
};

StaticFilesModule.prototype.updateHash = function(hash) {
	hash.update("static files module");
	hash.update(this.name || "");
	Module.prototype.updateHash.call(this, hash);
};
