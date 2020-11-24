#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TeletoBackendStack } from '../lib/teleto-backend-stack';

const app = new cdk.App();
new TeletoBackendStack(app, 'TeletoBackendStack');
