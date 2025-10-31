import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CUSTOMIZATIONS, type Customization } from './registry.js';

export interface AddCustomizationsResult {
  added: Customization[];
  skipped: Customization[];
}

export async function detectCustomizations(agentPath: string): Promise<Customization[]> {
  const detected: Customization[] = [];

  for (const [name, dir] of Object.entries(CUSTOMIZATIONS)) {
    const dirPath = path.join(agentPath, dir);
    if (await fs.pathExists(dirPath)) {
      detected.push(name as Customization);
    }
  }

  return detected;
}

export async function copyCustomization(
  templateAgentPath: string,
  agentPath: string,
  customization: Customization
): Promise<void> {
  const sourceDir = path.join(templateAgentPath, CUSTOMIZATIONS[customization]);
  const targetDir = path.join(agentPath, CUSTOMIZATIONS[customization]);

  await fs.copy(sourceDir, targetDir, {
    overwrite: false,
    errorOnExist: false,
  });
}

export async function addCustomizations(
  agentPath: string,
  customizations: Customization[],
  templateAgentPath: string
): Promise<AddCustomizationsResult> {
  // If no customizations requested, nothing to do
  if (customizations.length === 0) {
    return { added: [], skipped: [] };
  }

  // Detect existing customizations
  const existing = await detectCustomizations(agentPath);

  // Filter to only new customizations
  const toAdd = customizations.filter(custom => !existing.includes(custom));
  const skipped = customizations.filter(custom => existing.includes(custom));

  // Report what's already there
  if (skipped.length > 0) {
    console.log(chalk.gray(`Already present: ${skipped.join(', ')}`));
  }

  // Nothing to do
  if (toAdd.length === 0) {
    console.log(chalk.green('✓ All requested customizations already exist'));
    return { added: [], skipped };
  }

  // Add new customizations
  console.log(chalk.cyan(`Adding: ${toAdd.join(', ')}`));
  for (const customization of toAdd) {
    await copyCustomization(templateAgentPath, agentPath, customization);
  }

  return { added: toAdd, skipped };
}

