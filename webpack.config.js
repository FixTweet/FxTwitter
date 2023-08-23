const path = require('path');
const webpack = require('webpack');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const gitCommit = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();
const gitCommitFull = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString()
  .trim();
const gitUrl = require('child_process')
  .execSync('git remote get-url origin')
  .toString()
  .trim();
const gitBranch = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

// Get worker name from wrangler.toml
let workerName = 'fixtweet';

try {
  workerName = require('fs')
  .readFileSync('wrangler.toml')
  .toString()
  .match(/name ?= ?"(.+)"/)[1];
} catch(e) {
  console.error(`Error reading wrangler.toml to find worker name, using 'fixtweet' instead.`)
}

const releaseName = `${workerName}-${gitBranch}-${gitCommit}-${new Date()
  .toISOString()
  .substring(0, 19)}`;

require('dotenv').config();

let envVariables = [
  'BRANDING_NAME',
  'STANDARD_DOMAIN_LIST',
  'DIRECT_MEDIA_DOMAINS',
  'TEXT_ONLY_DOMAINS',
  'INSTANT_VIEW_DOMAINS',
  'HOST_URL',
  'REDIRECT_URL',
  'EMBED_URL',
  'MOSAIC_DOMAIN_LIST',
  'API_HOST_LIST',
  'SENTRY_DSN',
  'DEPRECATED_DOMAIN_LIST',
  'DEPRECATED_DOMAIN_EPOCH'
];

let plugins = [
  ...envVariables.map(envVar => {
    return new webpack.DefinePlugin({
      [envVar]: JSON.stringify(process.env[envVar])
    });
  }),
  new webpack.DefinePlugin({
    RELEASE_NAME: `'${releaseName}'`
  })
];

if (process.env.SENTRY_AUTH_TOKEN) {
  plugins.push(
    sentryWebpackPlugin({
      release: {
        name: releaseName,
        create: true,
        vcsRemote: gitUrl,
        setCommits: {
          auto: true,
          ignoreMissing: true
        }
      },
      include: './dist',
      urlPrefix: '~/',
      ignore: ['node_modules', 'webpack.config.js'],
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  );
} else {
  console.log('No Sentry auth token found, skipping Sentry release upload.');
}

module.exports = {
  entry: { worker: './src/server.ts' },
  target: 'webworker',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { util: false }
  },
  plugins: plugins,
  optimization: { mangleExports: false },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true }
      }
    ]
  }
};
