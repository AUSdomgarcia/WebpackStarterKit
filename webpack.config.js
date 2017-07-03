const webpack = require('webpack')
const resolve = require('path').resolve
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const LiveReloadPlugin = require('webpack-livereload-plugin')
// const IncludeReplaceWebpackPlugin = require('include-replace-webpack-plugin'); 
const IncludeFileWebpackPlugin = require('include-file-webpack-plugin')
const _ = require('lodash')

const DEBUG = process.env.NODE_ENV !== 'production'
const SRC = './public'
const DEST = './dist'

let glob = require("glob")

// glob("public/html/*.html", {}, function (er, files) {
  // console.log(files);
  // files is an array of filenames. 
  // If the `nonull` option is set, and nothing 
  // was found, then files is ["**/*.js"] 
  // er is an error object or null. 
// });

// let s = glob.sync("public/html/*.html",{});
// console.log(s);

class RegisterPageFactory {
  constructor(inputs, outputs){
    this.factories = [];

    inputs.map( (path, index, arr) => {
      this.factories.push(
            new IncludeFileWebpackPlugin({
              directory: './public/html/', //path to directory with files 
              input: path,
              output: outputs[index],
            })
          );
      });
  }
  getPages(){
    return this.factories;
  }
}

module.exports = {
  cache: true,

  context: __dirname,

  entry: {
    // JavaScript
    'assets/js/app': `${SRC}/js/app.js`,

    // CSS
    'assets/css/app': `${SRC}/css/app.js`
  },

  output: {
    path: resolve(__dirname, DEST),
    filename: '[name].js',
    pathinfo: DEBUG ? true : false,
    devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: DEBUG
                ? {
                  url: false,
                  sourceMap: true,
                  importLoaders: 1
                } :
                {
                  url: false
                }
            },
            {
              loader: 'postcss-loader',
              options: DEBUG
                ? { sourceMap: 'inline' }
                : {}
            },
          ]
        })
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['env'],
              cacheDirectory: true
            }
          }
        ]
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  plugins: [
    // Delete old files when compiling
    new CleanWebpackPlugin([ DEST ]),

    // Extract to .css
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true // preserve source maps
    }),

    // Compress React (and others)
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    
    // Copying files directly
    new CopyWebpackPlugin([
      { from: `${SRC}/assets`, to: './assets' },
      { from: `${SRC}/html`, to: '.' },
    ]),
    
  ].concat(
    
    (new RegisterPageFactory(
      ['index.html', 'contacts.html'],
      ['../../tmp/index.html', '../../tmp/contacts.html']
      )).getPages()
    
  )
  .concat(DEBUG ? [
    // LiveReload in development
    new LiveReloadPlugin({
      appendScriptTag: true
    }),

    // Debug mode for old webpack plugins
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ] : []),

  // Hide source maps in production (no sourceMappingURL)
  devtool: DEBUG ? 'source-map' : 'hidden-source-map',

  // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/35
  stats: stats(),

  devServer: {
    stats: stats()
  },
}

function stats () {
  return {
    children: false,
    chunks: false,
    assetsSort: 'name',
  }
}