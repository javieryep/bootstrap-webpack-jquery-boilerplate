const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const globSync = require('glob').sync;

const IS_DEV = process.env.NODE_ENV === 'dev';

const config = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'eval' : 'source-map',
  entry: './src/js/index.js',
  output: {
    filename: 'js/[name].[hash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          IS_DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              fallback: 'file-loader',
              outputPath: 'public/images',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                mozjpeg: {
                  progressive: true,
                  quality: 65,
                },
                pngquant: {
                  quality: '65-90',
                  speed: 4,
                },
                gifsicle: {
                  interlaced: false,
                },
                webp: {
                  quality: 75,
                },
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attrs: [':data-src'],
              minimize: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'windows.jQuery': 'jquery',
    }),
    new CopyWebpackPlugin([
      {
        from: './src/public',
        to: 'public',
      },
    ]),
    ...globSync('src/**/*.html').map(fileName => {
      return new HtmlWebPackPlugin({
        template: fileName,
        favicon: path.resolve(__dirname, './src/public/icon.ico'),
        minify: !IS_DEV && {
          collapseWhitespace: true,
          preserveLineBreaks: true,
          removeComments: true,
        },
        filename: fileName.replace('src/', ''),
      });
    }),
    new MiniCssExtractPlugin({
      filename: IS_DEV ? 'css/[name].css' : 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].css',
    }),
    new webpack.HashedModuleIdsPlugin(),
    new PreloadWebpackPlugin({
      include: 'initial',
    }),
    new CssUrlRelativePlugin(),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'src'),
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true,
        },
      },
    },
    minimizer: [],
  },
};

if (!IS_DEV) {
  const TerserPlugin = require('terser-webpack-plugin');
  const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

  config.optimization.minimizer.push(
    new TerserPlugin(),
    new OptimizeCSSAssetsPlugin({})
  );
}

module.exports = config;
