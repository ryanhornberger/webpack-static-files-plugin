'use strict';

var path = require('path');
var fse = require('fs-extra');
var Watchpack = require("watchpack");

var StaticFilesFactory = require("./StaticFilesFactory");
var StaticFilesDependency = require("./StaticFilesDependency");
var SingleEntryDependency = require("webpack/lib/dependencies/SingleEntryDependency");

class StaticFilesPlugin 
{
	// args:
	//   string - directory to watch for files
	//   string - name of the module to be built
	//   regex[] - regex's to watch for
	constructor(sourceDir, moduleName, regexsToWatch)
	{
		this.sourceDir = sourceDir;
		this.moduleName = moduleName;
		this.regexsToWatch = regexsToWatch;
		
		this.watchedFiles = [];
		this.readyCallbacks = [];

		this._scanOnce();
	}

	//---- Initialization ----

	// Webpack Plugin Binding
	apply(compiler)
	{
		this.compiler = compiler;
	
		//bind if they run a one-time webpack call
		compiler.plugin('run', function(compiler, next) {
			this._ready(next);
		}.bind(this));

		//bind if they run a watcher webpack call
		compiler.plugin('watch-run', function(watching, next) {
			
			this.watching = watching;

			var callback = function(){
				next();
				this._watch();
			}.bind(this);

			this._ready(callback);

		}.bind(this));
		
		//configure the factory for the static files dependency at each compilation
		//(when you add a StaticFilesDependency this tells webpack where to find the factory that makes the compilable module)
		compiler.plugin("compilation", function(compilation, params) 
		{
			var staticFilesFactory = new StaticFilesFactory();
			var normalModuleFactory = params.normalModuleFactory;

			compilation.dependencyFactories.set(StaticFilesDependency, staticFilesFactory);
			compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);

		}.bind(this));

		//add the StaticFilesDependency to each compilation
		compiler.plugin("make", function(compilation, callback) 
		{
			var staticFilesDependency = new StaticFilesDependency(this.watchedFiles.map(function(e, idx) {
				var dep = new SingleEntryDependency(e);
				dep.loc = this.moduleName + ":" + (100000 + idx);
				return dep;
			}, this), this.moduleName);

			compilation.addEntry(this.compiler.options.context, staticFilesDependency, this.moduleName, callback);
			
		}.bind(this));
	}

	//---- Initial Directory Scan ----

	_scanOnce()
	{
		fse.walk(this.sourceDir)
		
			.on('data', function (fileData) {
				if (fileData.stats.isFile()) {
					this._addFileToWatchList(fileData.path);
				};
			}.bind(this))

			.on('end', function () {
				this._ready(null);
			}.bind(this));
	}

	_ready(callback)
	{
		if (!callback) {
			callback = function(){};
		};

		this.readyCallbacks.push(callback);

		if (this.readyCallbacks.length >= 2) {

			this.readyCallbacks.forEach(function(callback){
				callback();
			});

		};
	}

	//---- Operations ----

	_addFileToWatchList(filePath)
	{
		if (!this._fileIsAlreadyWatched(filePath) && this._fileShouldBeWatched(filePath)) {
			this.watchedFiles.push(filePath);
			return true;
		};

		return false;
	}

	//---- Directory Watcher ----

	_watch()
	{
		this.watchPack = new Watchpack({
		    poll: true //TODO do I need polling?
		    //aggregateTimeout: 1000, //TODO not sure we need aggregate. Add it later if it turns out we need it
		});

		this.watchPack.watch([], [this.sourceDir], Date.now()); //watch(string[] files, string[] directories, [number startTime])
		this.watchPack.on("change", this._onWatcherChange.bind(this));
	}

	_onWatcherChange(filePath, mtime)
	{
		if (this._addFileToWatchList(filePath)) {
			//TODO Our watcher and the webpack watcher both pick up the changes, and fire at the same time. 
			//This results in the webpack watcher picking up that this change belongs to it's desired watching
			//pool and thus triggers a second round of web-packing. Perhaps is a good thing?

			//console.log('watcher found new file!: ', filePath);
			this.watching.invalidate();
		}
	}

	//---- Helper Functions ----

	_fileShouldBeWatched(filePath)
	{
		if (this.regexsToWatch) {
			for(var i = 0; i < this.regexsToWatch.length; i++){
				if (this.regexsToWatch[i].test(filePath)) {
					return true;
				}
			}
		} else {
			return true;
		};

		return false;
	}

	_fileIsAlreadyWatched(filePath)
	{
		if (this.watchedFiles.indexOf(filePath) > -1) { //contains
			return true;
		};

		return false;
	}
}

module.exports = StaticFilesPlugin;