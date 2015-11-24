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
	constructor(sourcePath, contextPath, moduleName, regexsToWatch)
	{
		this.sourcePath = sourcePath;
		this.contextPath = contextPath;
		this.moduleName = moduleName;
		this.regexsToWatch = regexsToWatch;
		
		this.watchedJsFiles = [];
		this.watchedOtherFiles = [];
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
			
			if (this.watching) {
				this.watching = watching;
				next();
				return;
			};

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
			var readyCount = 0;
			var next = function(err) {
				if (err) {
					console.log(err);
					return;
				};

				if (++readyCount >= this.watchedJsFiles.length + 1) {
					callback();
				};
			}.bind(this);

			var staticFilesDependency = new StaticFilesDependency(this.watchedOtherFiles.map(function(path, idx) {
				var dep = new SingleEntryDependency(path);
				dep.loc = this.moduleName + ":" + (100000 + idx);
				return dep;
			}.bind(this), this), this.moduleName);

			compilation.addEntry(this.compiler.options.context, staticFilesDependency, this.moduleName, next);
			
			this.watchedJsFiles.forEach(function(inPath, idx){
				var pathParsed = path.parse(inPath.substring(this.contextPath.length, inPath.length));
				var destinationPath = path.join(pathParsed.dir, pathParsed.name);
				var singleEntryDependency = new SingleEntryDependency(inPath);
				singleEntryDependency.loc = destinationPath + ":" + (200000 + idx);
				compilation.addEntry(this.compiler.options.context, singleEntryDependency, destinationPath, next);
			}.bind(this));
		}.bind(this));
	}

	//---- Initial Directory Scan ----

	_scanOnce()
	{
		fse.walk(this.sourcePath)
		
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
		if (!this._fileIsAlreadyWatched(filePath) && this._fileShouldBeWatched(filePath)) 
		{
			
			if (/\.jsx?$/.test(filePath)) 
			{
				this.watchedJsFiles.push(filePath);
			}
			else
			{
				this.watchedOtherFiles.push(filePath);
			}

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

		this.watchPack.watch([], [this.sourcePath], Date.now()); //watch(string[] files, string[] directories, [number startTime])
		this.watchPack.on("change", this._onWatcherChange.bind(this));
	}

	_onWatcherChange(filePath, mtime)
	{
		if (this._addFileToWatchList(filePath)) {
			setTimeout(function(){
				this.watching.invalidate();				
			}.bind(this), 500);
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
		if (this.watchedOtherFiles.indexOf(filePath) > -1) { //contains
			return true;
		};

		if (this.watchedJsFiles.indexOf(filePath) > -1) { //contains
			return true;
		};

		return false;
	}
}

module.exports = StaticFilesPlugin;