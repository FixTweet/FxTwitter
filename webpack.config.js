const path = require('path');
const webpack = require('webpack');

require('dotenv').config();

module.exports = {
  entry: {
    worker: './src/server.ts'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { util: false }
  },
  plugins: [
    new webpack.DefinePlugin({
      BRANDING_NAME: `'${process.env.BRANDING_NAME}'`
    }),
    new webpack.DefinePlugin({
      BRANDING_NAME_DISCORD: `'${process.env.BRANDING_NAME_DISCORD}'`
    }),
    new webpack.DefinePlugin({
      DIRECT_MEDIA_DOMAINS: `'${process.env.DIRECT_MEDIA_DOMAINS}'`
    }),
    new webpack.DefinePlugin({
      HOST_URL: `'${process.env.HOST_URL}'`
    }),
    new webpack.DefinePlugin({
      REDIRECT_URL: `'${process.env.REDIRECT_URL}'`
    }),
    new webpack.DefinePlugin({
      MOSAIC_DOMAIN_LIST: `'${process.env.MOSAIC_DOMAIN_LIST}'`
    }),
    new webpack.DefinePlugin({
      API_HOST: `'${process.env.API_HOST}'`
    }),
    new webpack.DefinePlugin({
      SENTRY_DSN: `'${process.env.SENTRY_DSN}'`
    })
  ],
  optimization: {
    mangleExports: 'size'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      }
    ]
  }
};
