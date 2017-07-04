/* Modifications */
let RegisterPageFactory = require('./core/RegisterPageFactory')
const glob = require('glob')
const _ = require('lodash')
const pkg = require('./package.json');
const FailPlugin = require('webpack-fail-plugin');

/* Default */
const webpack = require('webpack')
const resolve = require('path').resolve
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const LiveReloadPlugin = require('webpack-livereload-plugin')

const DEBUG = process.env.NODE_ENV !== 'production'
const SRC = './public'
const DEST = './dist'
const TMP = './tmp'

module.exports = {
  cache: true,

  context: __dirname,

  entry: {
    'assets/js/app' : `${SRC}/js/app.js`,
    'assets/css/style' : `${SRC}/css/style.scss`,
    // TODO: segregate vendors
    // 'assets/vendor/vendor' : Object.keys(pkg.dependencies)
  },
  output: {
      // DEFAULT
      // pathinfo: DEBUG ? true : false,
      // devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]',
      
      // TODO:
      path: resolve(__dirname, `${TMP}`),
      filename: '[name].js',
  },

  watch: true,

  module: {
    rules: [
      {
        test: /.json$/,
        loaders: [
          'json-loader'
        ]
      },
      /*
      | JS Linters
      */
      {
        test: /.js$/,
        exclude: /node_modules|bower_components/,
        loader: 'eslint-loader?babel-eslint',
        enforce: 'pre'
      },
      /*
      | JS Loader - Babel Support
      */
      {
        test: /\.js$/,
        exclude: /node_modules|bower_components/,
        use: [
          {
            loader: 'babel-loader',
            options: DEBUG
                ? {
                  presets: ['env'],
                  cacheDirectory: true
                } : 
                {
                  presets: ['env'],
                  cacheDirectory: false,
                  sourceMap: false,
                }
          }
        ]
      },
      /*
      | Fonts Variance Loaders
      */
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loaders: ['url-loader?limit=10000&mimetype=application/font-woff']
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, 
        loaders: ['url-loader?limit=10000&mimetype=application/font-woff']
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
        loaders: ['url-loader?limit=10000&mimetype=application/octet-stream']
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
        loaders: ['file-loader']
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
        loaders: ['url-loader?limit=10000&mimetype=image/svg+xml']
      },
      /*
      | CSS Module Loader
      */
      {
        test: /\.(css|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader?minimize!sass-loader',
              options: DEBUG
                ? {
                  url: false,
                  sourceMap: true,
                  importLoaders: 1
                } :
                {
                  url: false
                }
            }
          ],
        })
      }
    ],
  },

  resolve: {
    extensions: ['.css','.scss','.js','.jsx'],
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    FailPlugin, 

    // Delete old files when compiling
    // new CleanWebpackPlugin([ /*DEST,*/ `${TMP}/assets` ]),

    // Extract to .css
    new ExtractTextPlugin({
      filename: '[name].css',
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
    
    (new RegisterPageFactory(
      fixPath('public/html/', ''),
      fixPath('public/html/', '../../tmp/'))
    ).getPages()
    
  ).concat(
    // TODO: Copying files directly upon npm start BUILD only
    new CopyWebpackPlugin([
      {from: `${SRC}/assets`, to: `./assets`}, // relative to path TMP
      // { from: `${SRC}/html`, to: '.' },
    ])
  )

  .concat([
    new webpack.HotModuleReplacementPlugin({
      // multiStep: true
    })
  ])

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
    stats: stats(),
    hot: true,
    inline: true, // use inline method for hmr 
    host: 'localhost',
    port: 8080,
    contentBase: resolve(__dirname, `${TMP}`) //path.join(__dirname, 'tmp')
  },
}

function stats () {
  return {
    children: false,
    chunks: false,
    assetsSort: 'name',
  }
}

/*
| Automate fetching of file from public directory in parallel way.
| ex. ['index.html', '../../tmp/index.html']
| @param Inputs, Outputs array
*/
function fixPath(path, to){
  let files = glob.sync('public/html/*.html',{});
  let filePath = _.map(files, (file) => {
    return file.replace(path, to);
  });
  return filePath;
}