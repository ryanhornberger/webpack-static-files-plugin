var Tapable = require("tapable");
var StaticFilesModule = require("./StaticFilesModule");

function StaticFilesFactory() {
	Tapable.call(this);
}
module.exports = StaticFilesFactory;

StaticFilesFactory.prototype = Object.create(Tapable.prototype);
StaticFilesFactory.prototype.constructor = StaticFilesFactory;

StaticFilesFactory.prototype.create = function(context, dependency, callback) {
	callback(null, new StaticFilesModule(context, dependency.dependencies, dependency.name));
};