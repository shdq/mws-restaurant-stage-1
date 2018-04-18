const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');

module.exports = {
  entry: {
    dbhelper: './src/js/dbhelper.js',
    app: './src/js/main.js',
    restaurant: './src/js/restaurant_info.js',
  }, 
  output: {
    filename: './js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.(jpe?g|png)$/i,
        loaders: [
          'file-loader?name=img/[name].webp',
          'webp-loader'
        ]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: './src/index.html',
      chunks: ['dbhelper', 'app'],
      filename: 'index.html' //relative to root of the application
  }),
  new HtmlWebpackPlugin({
      hash: true,
      template: './src/restaurant.html',
      chunks: ['dbhelper', 'restaurant'],
      filename: 'restaurant.html' 
  }),
  new ExtractTextPlugin("./css/styles.css"),
  new StyleExtHtmlWebpackPlugin({
    minify: true
  })
  ]
}
