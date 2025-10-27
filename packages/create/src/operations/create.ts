import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CORE_FILES, type Capability } from '../capabilities/registry.js';
import { copyCapability } from '../capabilities/operations.js';

const USER_SPECIFIC_FILES = [
  'node_modules',
  'chats',
  '.env',
  'bun.lock',
  'dist',
  '.cache',
  '.eslintcache',
  '*.tsbuildinfo'
];

export function createTemplateCopyFilter(templatePath: string) {
  return (src: string) => {
    const relativePath = path.relative(templatePath, src);
    const basename = path.basename(src);
    
    // Allow .env.template (before checking general .env exclusion)
    if (basename === '.env.template') {
      return true;
    }
    
    // Exclude user-specific files
    if (USER_SPECIFIC_FILES.some(pattern => 
      relativePath.startsWith(pattern) || basename === pattern
    )) {
      return false;
    }
    
    // Exclude chat JSON files but keep the directory structure
    if (relativePath.match(/^chats\/.*\.json$/)) {
      return false;
    }
    
    return true;
  };
}

export async function createAgentInProject(
  projectPath: string,
  agentName: string,
  capabilities: Capability[],
  templatePath: string
): Promise<void> {
  const agentPath = path.join(projectPath, 'src/ai/agents', agentName);
  const templateAgentPath = path.join(templatePath, 'src/ai/agents/template');

  console.log(chalk.cyan(`Creating agent: ${agentName}`));

  // Create agent directory
  await fs.ensureDir(agentPath);

  // Copy core files
  for (const file of CORE_FILES) {
    const src = path.join(templateAgentPath, file);
    const dest = path.join(agentPath, file);
    await fs.copy(src, dest);
  }

  // Copy requested capabilities
  if (capabilities.length > 0) {
    console.log(chalk.cyan(`Adding capabilities: ${capabilities.join(', ')}`));
    for (const capability of capabilities) {
      await copyCapability(templateAgentPath, agentPath, capability);
    }
  }
}

