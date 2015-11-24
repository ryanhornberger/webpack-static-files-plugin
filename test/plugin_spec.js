'use strict';

var expect = require('chai').expect;
var path = require('path');
var fse = require('fs-extra')

var webpack = require('webpack');
var webpackConfig = require('./plugin_spec/webpack.config.js');
 
var newFileToWatch1 = path.join(__dirname, 'plugin_spec', 'source', 'index-copy.nunj');
var newFileToWatch2 = path.join(__dirname, 'plugin_spec', 'source', 'index-copy.jsx');
fse.removeSync(newFileToWatch1);
fse.removeSync(newFileToWatch2);

describe('Run a webpack build with the plugin', function(){

	it('should parse an input directory system, return an output directory', function(done){

		var compiler = webpack(webpackConfig);
		var hasRun = false;
		compiler.run(function(err, stats){
			
			if (!hasRun) {

				expect(err).to.be.null;
				expect(stats).to.be.an('object');
				expect(Object.keys(stats.compilation.assets).length).to.equal(4);
				//1 nunj, 1 scss, 1 jsx, and 1 _static.js entry point file

				hasRun = true;
				done();

			};

		});

	});

	it('should update when a file is added during a watch session', function(done){

		var hasRun = false;
		var compiler = webpack(webpackConfig);
		var originalFilePath = path.join(__dirname, 'plugin_spec', 'source', 'index.nunj');
		var resultCount = 0;

		var resultHandler = function(stats) {
			if (!hasRun) {
				switch(resultCount) {
					case 0:
						step2(stats);
						break;
					case 1:
						step3(stats);
						break;
					default:
						step4(stats);
						break;
				}				
			};

			resultCount++;
		}

		var step2Hash = null;
		var step2 = function(stats) {
			expect(stats).to.be.an('object');
				
			step2Hash = stats.compilation.hash;
			
			fse.copySync(originalFilePath, newFileToWatch1);
		};

		var step3Hash = null;
		var step3 = function(stats) {
			expect(stats).to.be.an('object');

			step3Hash = stats.compilation.hash;

			fse.copySync(originalFilePath, newFileToWatch2);
		};

		var step4 = function(stats) {
			expect(stats).to.be.an('object');
		
			expect(step2Hash).to.not.equal(step3Hash);
			expect(step3Hash).to.not.equal(stats.compilation.hash);
			
			fse.removeSync(newFileToWatch1);
			fse.removeSync(newFileToWatch2);

			hasRun = true;
			done();
		};
			
		compiler.watch(null, function(err, stats){
			resultHandler(stats);
		});

	});

});
