(function(){
'use strict';

let RegisterPageFactory = require('./RegisterPageFactory');
let webpackConfig = require('../webpack.config');
let glob = require('glob');
let _ = require('lodash');
const TMP = './tmp';

webpackConfig.plugins.push( (new RegisterPageFactory(
  fixPath('public/html/', ''),
  fixPath('public/html/', `../.${TMP}/`))
).getPages() )

console.log('Recompiling HTML', fixPath('public/html/', ''));

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
