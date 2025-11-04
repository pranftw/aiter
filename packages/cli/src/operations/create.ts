import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CORE_FILES, type Customization } from '../customizations/registry';
import { copyCustomization } from '../customizations/operations';

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
  customizations: Customization[],
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

  // Copy requested customizations
  if (customizations.length > 0) {
    console.log(chalk.cyan(`Adding customizations: ${customizations.join(', ')}`));
    for (const customization of customizations) {
      await copyCustomization(templateAgentPath, agentPath, customization);
    }
  }
}

