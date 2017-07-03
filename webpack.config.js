/* Modifications */
let RegisterPageFactory = require('./core/RegisterPageFactory')
const glob = require('glob')
const _ = require('lodash')
const path = require('path');

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
    // JavaScript
    'assets/js/app': `${SRC}/js/app.js`,
    // CSS
    'assets/css/app': `${SRC}/css/app.js`
  },

  output: {
    // DEFAULT
    pathinfo: DEBUG ? true : false,
    devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]',
    filename: '[name].js',
    // TODO:
    path: resolve(__dirname, `${TMP}`),
},

  module: {
    rules: [
      /*
      |
      | CSS Module Loader
      |
      */
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
            }
          ],
        })
      },
      /*
      |
      | JS Module Loader
      |
      */
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
    new CleanWebpackPlugin([ /*DEST,*/ `${TMP}/assets` ]),

    // Extract to .css
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true // preserve source maps
    }),

    // Compress React (and others)
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    
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
      multiStep: true
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
  let replacedPath = _.map(files, (file) => {
    return file.replace(path, to);
  });
  return replacedPath;
}