import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CAPABILITIES, type Capability } from './registry.js';

export interface AddCapabilitiesResult {
  added: Capability[];
  skipped: Capability[];
}

export async function detectCapabilities(agentPath: string): Promise<Capability[]> {
  const detected: Capability[] = [];

  for (const [name, dir] of Object.entries(CAPABILITIES)) {
    const dirPath = path.join(agentPath, dir);
    if (await fs.pathExists(dirPath)) {
      detected.push(name as Capability);
    }
  }

  return detected;
}

export async function copyCapability(
  templateAgentPath: string,
  agentPath: string,
  capability: Capability
): Promise<void> {
  const sourceDir = path.join(templateAgentPath, CAPABILITIES[capability]);
  const targetDir = path.join(agentPath, CAPABILITIES[capability]);

  await fs.copy(sourceDir, targetDir, {
    overwrite: false,
    errorOnExist: false,
  });
}

export async function addCapabilities(
  agentPath: string,
  capabilities: Capability[],
  templateAgentPath: string
): Promise<AddCapabilitiesResult> {
  // If no capabilities requested, nothing to do
  if (capabilities.length === 0) {
    return { added: [], skipped: [] };
  }

  // Detect existing capabilities
  const existing = await detectCapabilities(agentPath);

  // Filter to only new capabilities
  const toAdd = capabilities.filter(cap => !existing.includes(cap));
  const skipped = capabilities.filter(cap => existing.includes(cap));

  // Report what's already there
  if (skipped.length > 0) {
    console.log(chalk.gray(`Already present: ${skipped.join(', ')}`));
  }

  // Nothing to do
  if (toAdd.length === 0) {
    console.log(chalk.green('✓ All requested capabilities already exist'));
    return { added: [], skipped };
  }

  // Add new capabilities
  console.log(chalk.cyan(`Adding: ${toAdd.join(', ')}`));
  for (const capability of toAdd) {
    await copyCapability(templateAgentPath, agentPath, capability);
  }

  return { added: toAdd, skipped };
}

