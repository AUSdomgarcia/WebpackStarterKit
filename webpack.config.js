/* Modifications */
const pkg = require('./package.json');
const FailPlugin = require('webpack-fail-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

const webpack = require('webpack');
const resolve = require('path').resolve;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

// SET ENV
const isProd = process.env.NODE_ENV.includes('production');

const SRC = './public';
const DIST = './dist';
const TMP = './tmp';

const pageCommandConfig = ! isProd ? {
                                  onBuildExit: ['node ./core/command-register-page.js']
                                } : {
                                  onBuildEnd: ['node ./core/command-register-page.js']
                                }

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
    filename: './assets/[name].bundle.js',
    pathinfo: !isProd ? true : false,
    devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
  },

  watch: true,

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
        use: ['url-loader?limit=10000&mimetype=application/font-woff']
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, 
        use: ['url-loader?limit=10000&mimetype=application/font-woff']
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
        use: ['url-loader?limit=10000&mimetype=application/octet-stream']
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
        use: ['file-loader']
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
        use: ['url-loader?limit=10000&mimetype=image/svg+xml']
      },
      /*
      | CSS Module Loader
      */
      {
        test: /\.(css|scss)$/,
        use: ExtractTextPlugin.extract({
                  fallback: 'style-loader',
                  use: ['css-loader','sass-loader']
                })
      }
    ],
  },
  // TODO: If necessary
  // resolve: {
    // extensions: ['.css','.scss','.js','.jsx'],
  // },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    FailPlugin,
    // Delete old files when compiling
    new CleanWebpackPlugin([`${TMP}/*.html`]),
    // Force create HTML
    new WebpackShellPlugin(pageCommandConfig),
    // Extract to .css
    new ExtractTextPlugin({
      filename: './assets/[name].bundle.css',
      // disable:  false, // true when HMR were use in production only, !isProd,
      allChunks: true // preserve source maps
    }),
    // Compress React (and others)
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
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
    // TODO: Copying files directly upon npm start BUILD only
    new CopyWebpackPlugin([
      {from: `${SRC}/assets`, to: `./assets`}, // relative to path TMP
      {from: `${SRC}/html`, to: '../public/html' },
    ])
  )
  // .concat([
    // new webpack.HotModuleReplacementPlugin(),
    // new webpack.NamedModulesPlugin()
  // ]),
  .concat( !isProd ? [
    // LiveReload in development
    new LiveReloadPlugin(),
    // Debug mode for old webpack plugins
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ] : []),

  // Hide source maps in production (no sourceMappingURL)
  devtool: !isProd ? 'source-map' : 'hidden-source-map',

  // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/35
  stats: stats(),

  devServer: {
    stats: stats(),
    contentBase: TMP
    // hot: true,
    // inline: true, /* use inline method for hmr */
    // host: 'localhost',
    // port: 8080,
    // contentBase: resolve(__dirname, `${TMP}`) //path.join(__dirname, 'tmp')
  }
}

function stats () {
  return {
    warnings: false, // remove warning in console 
    children: false,
    chunks: false,
    assetsSort: 'name',
  }
}
