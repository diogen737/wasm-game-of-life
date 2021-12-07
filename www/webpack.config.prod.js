const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.common');

module.exports = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new MiniCssExtractPlugin(),
    new CssMinimizerPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
});
