Webpack Static Files Plugin
===============================================================================

Use Webpack as a static files compiler!

Use the StaticFilesPlugin just like any other webpack plugin. You tell it the source directory, a name for the entry module, and the criteria patterns of files you want it to watch for. 

Next, configure your output settings, loaders, and other webpack configs as normal. 

When you run your webpack build the StaticFilesPlugin will add entry points for every file in your source directory that matches it's criteria. 

If you are running in watch mode, new files will be automatically added to the entry points of the build on-the-fly.

The output settings of the build configuration will determine the output structure of the plugin files.

NOTE - At this moment, you must use a combination of the file-loader and the StaticFilesPlugin for this to all work correctly. A #TODO of this project is to automatically implement the file-loader on your behalf.

Example Configuration
---------------------

Below is an example configuration that supports the following conversions:

* nunj --> html
* scss --> css
* jsx --> js

...

	{
        name: 'Precompiled static assets',       
        
        //entry: the StaticFilesPlugin will place entry files for you
        plugins: [
            new StaticFilesPlugin(
                './public/',
                '_public',
                [
                    /\.jsx$/,
                    /\.scss$/,
                    /\.nunj$/
                ]
            )
        ],
        //output: the place we drop the resulting files
        output: 
        {
            path: './_compiled/',
            filename: '../[name].js'
        },
        module: 
        {
        	//each loader is currently using the file-loader to produce the resulting file
        	//a todo for this project is to make that unecessary
            loaders: 
            [
                { 
                    test: /\.jsx$/, 
                    exclude: /node_modules/, 
                    loader: 'file?context=./&name=[path][name].js!babel'
                },
                { 
                    test: /\.scss$/, 
                    loader: 'file?context=./&name=[path][name].css!sass?' + 
                        JSON.stringify({
                            'outputStyle':'compressed', //'expanded' is your alternative,
                            'includePaths': 
                                nodeNeat.includePaths
                                .concat([
                                    './source'
                                ])
                        })
                },               
                { 
                    test: /\.nunj$/, 
                    loader: 'file?context=' + appPath + '&name=[path][name].html!nunjucks-html-loader?' +
                        JSON.stringify({
                            'searchPaths': [
                                './source'
                            ]
                        })
                },
                {
                    test: /\.(?=[^.]*$)(?!(jsx?|scss|nunj)).*$/, //catch all remaining files and copy them over as they are
                    loader: 'file?context=' + appPath + '&name=[path][name].[ext]'
                }
            ]
        }
    }

Example Converstion
-------------------

Under the above configuration, this source folder structure:

	./public
		/index.nunj
		/index.scss
		/index.jsx
		/about
			/index.nunj
			/index.scss
		/download
			/index.nunj
			/index.scss

Will compile down to this output structure:

	./_compiled
		/_public.js - the multi-part entry file that makes all this magic happen (used only for webpack, mostly useless to you.)
		
		/_public
			/index.html
			/index.css
			/index.js
			/about
				/index.html
				/index.css
			/download
				/index.html
				/index.css

Everything in the './_compiled/_public/' directory is identical to the structure in the './public' directory, except every file has been compiled to it's web-ready format.

Todo for 1.0
------------

* Document more on how this can be configured for images and other static, non-compiled file types. 
* Remove the need for the file-loader
* Test more!


