import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { detectContext } from '../utils/context';
import { createAgentInProject } from '../operations/create';
import { addCustomizations } from '../customizations/operations';
import { resolveCustomizations, validateCustomizations, type Customization, getAllCustomizations } from '../customizations/registry';
import { promptForCustomizations } from '../interactive';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get template path - check both production (./template) and dev (../template) locations
function getTemplatePath(): string {
  const prodPath = path.join(__dirname, '..', '..', 'template');
  const devPath = path.join(__dirname, '..', '..', '..', 'template');
  
  // Check production path first (when running from dist)
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }
  
  // Fall back to dev path (when running from src)
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  // Return prod path as default (will trigger error later with correct path)
  return prodPath;
}

export const addCommand = {
  command: 'add <type> <name>',
  describe: 'Add a resource to an existing aiter project',
  builder: (yargs: any) => {
    return yargs
      .positional('type', {
        type: 'string',
        description: 'Resource type to add',
        choices: ['agent'],
        demandOption: true,
      })
      .positional('name', {
        type: 'string',
        description: 'Resource name',
        demandOption: true,
      })
      .option('path', {
        alias: 'p',
        type: 'string',
        description: 'Project directory path',
        default: '.',
      })
      .option('customize', {
        alias: 'c',
        type: 'array',
        description: 'Customizations to include',
        choices: [...getAllCustomizations(), 'all'],
      })
      .option('interactive', {
        alias: 'i',
        type: 'boolean',
        description: 'Interactive mode',
        default: true,
      });
  },
  handler: async (argv: any) => {
    // Validate type
    if (argv.type !== 'agent') {
      console.error(chalk.red(`Error: Unknown resource type '${argv.type}'. Valid types: agent`));
      process.exit(1);
    }
    
    // Add agent
    const templatePath = getTemplatePath();
    
    // Check if template directory exists
    if (!(await fs.pathExists(templatePath))) {
      console.error(chalk.red('Error: Template directory not found!'));
      console.error(chalk.gray(`Expected at: ${templatePath}`));
      process.exit(1);
    }

    // Determine the target path
    const currentDir = path.resolve(argv.path);
    
    // Detect if we're in an existing aiter project
    const context = await detectContext(currentDir);

    let customizations: Customization[] = [];

    // Handle customizations
    if (argv.customize) {
      // User explicitly specified customizations
      const requestedCustomizations = argv.customize as string[];
      customizations = resolveCustomizations(requestedCustomizations);
      
      const { valid, invalid } = validateCustomizations(customizations);
      
      if (invalid.length > 0) {
        console.error(chalk.red(`Error: Unknown customizations: ${invalid.join(', ')}`));
        process.exit(1);
      }
      
      customizations = valid;
    } else if (argv.interactive) {
      // Interactive mode and no explicit customizations = prompt
      customizations = await promptForCustomizations();
    }

    if (!context.isAiterProject) {
      // Not in an aiter project - error
      console.error(chalk.red('\nError: Not in an aiter project!'));
      console.error(chalk.gray('To add an agent, you must be in an existing aiter project.'));
      console.error(chalk.gray('To create a new project, use: bunx @aiter/cli create <name>\n'));
      process.exit(1);
    } else {
      // Existing aiter project
      console.log(chalk.blue('\n✓ Detected existing aiter project\n'));

      const agentExists = context.agents.includes(argv.name);

      if (agentExists) {
        // Add customizations to existing agent
        console.log(chalk.cyan(`Adding customizations to agent: ${argv.name}`));
        const agentPath = path.join(currentDir, 'src/ai/agents', argv.name);
        const templateAgentPath = path.join(templatePath, 'src/ai/agents/template');
        
        await addCustomizations(agentPath, customizations, templateAgentPath);
        
        console.log(chalk.green('\n✓ Done!\n'));
      } else {
        // Create new agent in existing project
        console.log(chalk.cyan(`Creating new agent: ${argv.name}`));
        
        await createAgentInProject(currentDir, argv.name, customizations, templatePath);
        
        console.log(chalk.green('\n✓ Agent created successfully!\n'));
        console.log(chalk.bold('Next steps:\n'));
        console.log(chalk.cyan(`  bun run src/index.tsx --agent ${argv.name}\n`));
      }
    }
  }
};

