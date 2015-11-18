'use strict';

var path = require('path');
var fse = require('fs-extra');
var StaticFilesPlugin = require('../../lib/StaticFilesPlugin');

var sourceDir = path.join(__dirname, 'source');
var destinationDir = path.join(__dirname, 'compiled');
var moduleName = '_static';

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
				loader: 'file?context=' + path.join(sourceDir) + '&name=[path][name].js!babel'
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