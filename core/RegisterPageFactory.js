const IncludeFileWebpackPlugin = require('include-file-webpack-plugin')
const PUBLIC_HTML = './public/html/';

class RegisterPageFactory {

  constructor(inputs, outputs){
    this.factories = [];

    inputs.map( (path, index, arr) => {
      this.factories.push(
            new IncludeFileWebpackPlugin({
              directory: PUBLIC_HTML,
              input: path,
              output: outputs[index], // parallel inputs to outputs
            })
          );
      });
  }
  
  getPages(){
    return this.factories;
  }
}

module.exports = RegisterPageFactory;