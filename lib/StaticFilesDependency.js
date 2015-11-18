var Dependency = require("webpack/lib/Dependency");

function StaticFilesDependency(dependencies, name) {
	Dependency.call(this);
	this.dependencies = dependencies;
	this.name = name;
}
module.exports = StaticFilesDependency;

StaticFilesDependency.prototype = Object.create(Dependency.prototype);
StaticFilesDependency.prototype.constructor = StaticFilesDependency;
StaticFilesDependency.prototype.type = "static files entry ";
