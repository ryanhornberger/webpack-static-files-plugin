'use strict';

var path = require('path');
var fse = require('fs-extra');
var StaticFilesPlugin = require('../../lib/StaticFilesPlugin');

var appDir = path.join(__dirname);
var sourceDir = path.join(appDir, 'source');
var destinationDir = path.join(appDir, 'compiled');

var moduleName = 'source';

fse.removeSync(destinationDir);

module.exports = {
	name: 'Test Static Files Plugin',

	output: 
	{
		path: path.join(destinationDir, moduleName),
		filename: '../[name].js'
	},

	plugins: [
		new StaticFilesPlugin(
        	sourceDir,
        	appDir,
            moduleName,
        	[
        		/\.jsx$/,
        		/\.scss$/,
        		/\.nunj$/
        	]
        )
    ],

	module: 
	{
		loaders: 
		[

			// Javascript enty points
			{ 
				test: /\.jsx$/, 
				exclude: /(node_modules|bower_components)/,
				loader: 'babel'
			},

			// Sass enty points
			{ 
				test: /\.scss$/, 
				loader: 'file?context=' + path.join(sourceDir) + '&name=[path][name].css!sass'
			},

			// Nunjucks enty points
			{
                test: /\.nunj$/,
                loader: 'file?context=' + path.join(sourceDir) + '&name=[path][name].html!nunjucks-html'
            }
            
		]
	}
}