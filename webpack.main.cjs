// webpack.main.cjs
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  mode: 'production',
  entry: './main.cjs',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.cjs',
  },
};
