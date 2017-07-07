/* Modifications */
const glob_all = require('glob-all');
const path = require('path');
const pkg = require('./package.json');
const FailPlugin = require('webpack-fail-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');

const webpack = require('webpack');
const resolve = require('path').resolve;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

const isProd = process.env.NODE_ENV.includes('production');

const SRC = './public';
const DIST = './dist';
const TMP = './tmp';
const ENV = ! isProd ? TMP : DIST;

const pageCommandConfig = 
      ! isProd ? {
        onBuildExit: ['echo "NWmodule: Development HTML" && node ./core/command-register-page.js']
      } : {
        onBuildEnd:  ['echo "NWmodule: Production HTML" && node ./core/command-register-page.js']
      } 

const cleanFilesConfig = ! isProd ? [`${TMP}/*.html`] : [`${TMP}/`];

console.log('DEBUG:', path.join(__dirname, `${SRC}/html/*.html`));

module.exports = {
  cache: true,
  context: __dirname,
  entry: {
    main: `${SRC}/appRoot.js`
    // TODO: segregate vendors
    // 'assets/vendor/vendor' : Object.keys(pkg.dependencies)
  },
  output: {
    path: resolve(__dirname, `${TMP}`),
    filename: './[name].bundle.js',
    pathinfo: !isProd ? true : false,
    devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
  },
  // TODO: if necessary
  // watch: true,
  module: {
    rules: [
        {
          test: /.json$/,
          use: [
            'json-loader'
          ]
        },
        /*
        | JS Linters
        */
        {
          test: /.js$/,
          exclude: /node_modules|bower_components/,
          // loader: 'eslint-loader?babel-eslint',
          use: ['eslint-loader'],
          enforce: 'pre'
        },
        /*
        | JS Loader - Babel Support
        */
        {
          test: /\.js$/,
          exclude: /node_modules|bower_components/,
          use: 'babel-loader'
        },
        /*
        | Fonts Variance Loader
        */
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          use: ['file-loader?limit=10000&mimetype=application/font-woff&&name=fonts/[name].[ext]']
        },
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, 
          use: ['file-loader?limit=10000&mimetype=application/font-woff&&name=fonts/[name].[ext]']
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
          use: ['file-loader?limit=10000&mimetype=application/octet-stream&&name=fonts/[name].[ext]']
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
          use: ['file-loader?limit=10000&mimetype=application/octet-stream&&name=fonts/[name].[ext]']
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
          use: ['file-loader?limit=10000&mimetype=image/svg+xml&&name=fonts/[name].[ext]']
        },
        /*
        | CSS Module Loader
        */
        {
          test: /\.(css|scss)$/,
          exclude: /node_modules/,
          use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use:[{
                      loader: 'css-loader'
                     },
                     {
                      loader: 'sass-loader'
                     },
                     {
                      loader: 'resolve-url-loader'
                     }]
              })
        },
        {
            test    : /\.(png|jpg|svg)$/,
            include : path.join(__dirname, `${SRC}/img`),
            loader  : 'file-loader?limit=30000&name=img/[name].[ext]'
        }
      ]
        // ,
        // {
        //   test: /\.(css|scss)$/,
        //   use: ['style-loader','css-loader']
        // }
        // 'autoprefixer-loader?browsers=last 2 versions'
    },
    // TODO: If necessary
    resolve: {
     extensions: ['.css','.scss','.js','.woff2','.svg','.ttf','.eot','.woff'],
    },
    plugins: [
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      FailPlugin,
      // Delete old files when compiling
      new CleanWebpackPlugin(cleanFilesConfig),
      // Force create HTML
      new WebpackShellPlugin(pageCommandConfig),
      // CSS linter
      // new StyleLintPlugin({
      //   syntax: 'scss'
      // }),
      new CopyWebpackPlugin([
        {from: `${SRC}/img`, to: `./img`},
        {from: `${SRC}/html`, to: '../public/html' },
        {from: `${SRC}/fonts`, to: '../public/fonts'}
      ]),
      // Extract to .css
      new ExtractTextPlugin({
        // disable:  false, // true when HMR were use in production only, !isProd,
        filename: './[name].bundle.css',
        allChunks: true // preserve source maps
      }),
      new PurifyCSSPlugin({
        paths: glob_all.sync([
          path.join(__dirname, `${SRC}/html/*.html`),
          path.join(__dirname, `${SRC}/html/layout/*.html`)
        ]),
        styleExtensions: ['.css'],
        moduleExtensions: ['.html'],
        verbose: true,
        minimize: false,
        purifyOptions: {
          whitelist: [
            'fa',
            'active',
            'current-menu-item',
            'selectboxit',
            'mfp',
            'slicknav',
            'store-legends'
            ]
        }
      }),
      // Compress React (and others)
      new webpack.EnvironmentPlugin({
        NODE_ENV: 'development'
      })
      // TODO: Optimization
      // new webpack.optimize.UglifyJsPlugin({
      //   compress: {unused: true, dead_code: true, warnings: false}
      // }),
      // TODO: segregate vendors
      // new webpack.optimize.CommonsChunkPlugin({
      //   names: ['vendor'],
      //   minChunks: Infinity
      // })
    ].concat(
      [ require('autoprefixer') ] // not working
    )
    .concat( !isProd ? [
      new LiveReloadPlugin(),
      new webpack.LoaderOptionsPlugin({
        debug: true
      })
    ] : []),
    devtool: !isProd ? 'source-map' : 'hidden-source-map',
    stats: stats(),
    devServer: {
      stats: stats(),
      contentBase: path.join(__dirname, `${TMP}`)
    }
}

function stats () {
  return {
    warnings: false,
    children: false,
    chunks: false,
    assetsSort: 'name',
  }
}