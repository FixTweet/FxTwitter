import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

import fs from 'fs';

config();

const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
const gitUrl = execSync('git remote get-url origin').toString().trim();
const gitBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim()
  .replace(/[\\\/]/g, '-');

let workerName = 'fixtweet';

// Get worker name from wrangler.toml

try {
  workerName = fs
    .readFileSync('wrangler.toml')
    .toString()
    .match(/name ?= ?"(.+?)"/)[1];
} catch (e) {
  console.error(`Error reading wrangler.toml to find worker name, using 'fixtweet' instead.`);
}

const releaseName = `${workerName}-${gitBranch}-${gitCommit}-${new Date()
  .toISOString()
  .substring(0, 19)}`;

let envVariables = [
  'BRANDING_NAME',
  'STANDARD_DOMAIN_LIST',
  'DIRECT_MEDIA_DOMAINS',
  'TEXT_ONLY_DOMAINS',
  'INSTANT_VIEW_DOMAINS',
  'GALLERY_DOMAINS',
  'HOST_URL',
  'REDIRECT_URL',
  'EMBED_URL',
  'MOSAIC_DOMAIN_LIST',
  'API_HOST_LIST',
  'SENTRY_DSN',
  'DEPRECATED_DOMAIN_LIST',
  'DEPRECATED_DOMAIN_EPOCH'
];

// Create defines for all environment variables
let defines = {};
for (let envVar of envVariables) {
  defines[envVar] = `"${process.env[envVar]}"`;
}

defines['RELEASE_NAME'] = `"${releaseName}"`;

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  sourcemap: 'external',
  outdir: 'dist',
  minify: true,
  bundle: true,
  format: 'esm',
  plugins: [
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      telemetry: false,

      release: {
        name: releaseName,
        create: true,
        vcsRemote: gitUrl,
        setCommits: {
          auto: true,
          ignoreMissing: true
        }
      },

      // Auth tokens can be obtained from
      // https://sentry.io/orgredirect/organizations/:orgslug/settings/auth-tokens/
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  ],

  define: defines
});
