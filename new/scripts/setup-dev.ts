#!/usr/bin/env bun
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const devPath = path.join(process.cwd(), 'dev');

console.log('Setting up dev workspace...\n');

if (fs.existsSync(devPath)) {
  console.log('✓ dev/ already exists');
  console.log('  To recreate: rm -rf dev && bun setup-dev\n');
} else {
  execSync('bun run packages/create/src/index.ts --type app --name dev --path .', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
}

console.log('\n✓ Dev workspace ready!\n');
console.log('Next steps:');
console.log('  1. Create dev/.env with your configuration');
console.log('  2. Run: bun dev -a example\n');

