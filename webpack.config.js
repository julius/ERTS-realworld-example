const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "development",
  devtool: 'inline-source-map',

  devServer: {
    // show compilation errors
    overlay: true,
    // all routes go to index.html
    historyApiFallback: true,
  },

  entry: {
    main: './src/index.tsx',
  },
  output: {
    filename: '[name].js',
    publicPath: "",
    path: path.resolve(__dirname, 'dist')
  },

  module: {
    rules: [
      // PRETTIER
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: [
          { loader: "thread-loader", options: {} },
          { loader: "prettier-loader", options: { parser: "typescript" } },
        ]
      },
      // TS LINT
      {
        test: /\.tsx?$/,
        include: [path.resolve(__dirname, "src")],
        exclude: /node_modules/,
        enforce: 'pre',
        use: [
          { loader: "thread-loader", options: {} },
          {
            loader: 'tslint-loader',
            options: {
              configFile: path.resolve(__dirname, "tslint.json"),
              emitErrors: true,
              failOnHint: true,
              formattersDirectory: 'node_modules/tslint-formatter-beauty',
              formatter: 'beauty',
              typeCheck: true,
              tsConfigFile: 'tsconfig.json',
            }
          }
        ]
      },
      // TYPESCRIPT
      {
        test: /\.tsx?$/,
        include: [path.resolve(__dirname, "src")],
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader', 
          },
        ]
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    // tree shakings
    usedExports: true
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'public' }
    ]),
    new HTMLPlugin({
      template: path.resolve(__dirname, "public/index.html")
    }),
  ]
};