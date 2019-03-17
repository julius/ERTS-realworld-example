const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const baseConfig = require("./webpack.config")

module.exports = Object.assign({}, baseConfig, {
  mode: "production",
  devtool: 'none',
  optimization: Object.assign({}, baseConfig.optimization, {
    minimizer: [new UglifyJsPlugin()],
  })
})
