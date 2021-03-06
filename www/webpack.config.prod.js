const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { BaseHrefWebpackPlugin } = require('base-href-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.common');

module.exports = merge(commonConfig, {
  mode: 'production',
  output: {
    clean: true
  },
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
  plugins: [
    new BaseHrefWebpackPlugin({ baseHref: '/wasm-game-of-life/' }),
    new MiniCssExtractPlugin({
      filename: '[name].[fullhash].css',
    }),
    new CssMinimizerPlugin(),
  ],
});
