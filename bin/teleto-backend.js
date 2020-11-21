#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { TeletoBackendStack } = require('../lib/teleto-backend-stack');

const app = new cdk.App();
new TeletoBackendStack(app, 'TeletoBackendStack');
