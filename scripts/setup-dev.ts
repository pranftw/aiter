#!/usr/bin/env bun
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const devPath = path.join(process.cwd(), 'dev');
const rootPackageJsonPath = path.join(process.cwd(), 'package.json');

console.log('Setting up dev workspace...\n');

if (fs.existsSync(devPath)) {
  console.log('✓ dev/ already exists');
  console.log('  To recreate: rm -rf dev && bun setup-dev\n');
} else {
  console.log('Creating dev workspace...');
  execSync('bun run packages/create-aiter-app/src/index.ts -n dev', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✓ Dev workspace created');
}

const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
if (!rootPackageJson.workspaces.includes('dev')) {
  rootPackageJson.workspaces.push('dev');
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
  console.log('✓ Added dev to workspaces');
  
  console.log('\nReinstalling to link workspaces...');
  execSync('bun install', { stdio: 'inherit' });
}

console.log('\n✓ Dev workspace ready!\n');
console.log('Next steps:');
console.log('  1. Create dev/.env with your configuration');
console.log('  2. Run: bun dev -a example\n');

