(function(){
'use strict';

const isProd = process.env.NODE_ENV.includes('production');
const DIST = './dist';
const TMP = './tmp';
const ENV = ! isProd ? TMP : DIST;

let RegisterPageFactory = require('./RegisterPageFactory');
let glob = require('glob');
let _ = require('lodash');

(new RegisterPageFactory(
  fixPath('public/html/', ''),
  fixPath('public/html/', `../.${ENV}/`))
)
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

})();
