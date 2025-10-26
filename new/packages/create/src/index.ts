#!/usr/bin/env bun

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { detectContext } from './utils/context.js';
import { createProjectWithAgent, createAgentInProject } from './operations/create.js';
import { addCapabilities } from './capabilities/operations.js';
import { promptForCapabilities } from './interactive.js';
import { customizeComponents } from './commands/component.js';
import { resolveCapabilities, validateCapabilities, type Capability } from './capabilities/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get template path - check both production (./template) and dev (../template) locations
function getTemplatePath(): string {
  const prodPath = path.join(__dirname, 'template');
  const devPath = path.join(__dirname, '..', 'template');
  
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

async function createApp(name: string, targetDir: string) {
  const targetPath = path.resolve(targetDir, name);
  const templatePath = getTemplatePath();

  console.log(chalk.blue('\nCreating aiter app...'));
  console.log(chalk.gray(`Target: ${targetPath}\n`));

  // Check if target directory already exists
  if (await fs.pathExists(targetPath)) {
    console.error(chalk.red(`Error: Directory ${targetPath} already exists!`));
    process.exit(1);
  }

  // Check if template directory exists
  if (!(await fs.pathExists(templatePath))) {
    console.error(chalk.red('Error: Template directory not found!'));
    console.error(chalk.gray(`Expected at: ${templatePath}`));
    process.exit(1);
  }

  try {
    // Copy template to target directory
    console.log(chalk.cyan('Copying template files...'));
    await fs.copy(templatePath, targetPath);

    // Update package.json with project name and replace workspace dependencies
    const packageJsonPath = path.join(targetPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = name;
    
    // Check if we're creating inside the aiter monorepo
    const isInMonorepo = await fs.pathExists(path.join(process.cwd(), 'packages/aiter/package.json'));

    // Handle dependencies based on environment
    if (packageJson.dependencies) {
      for (const [key, value] of Object.entries(packageJson.dependencies)) {
        if (value === 'workspace:*') {
          // If NOT in monorepo, replace with latest from npm
          if (!isInMonorepo) {
            packageJson.dependencies[key] = 'latest';
          }
        }
      }
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // If in monorepo, add to workspaces and install from root
    if (isInMonorepo) {
      const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
      const rootPackageJson = await fs.readJson(rootPackageJsonPath);
      const relativePath = path.relative(process.cwd(), targetPath);
      
      if (!rootPackageJson.workspaces.includes(relativePath)) {
        rootPackageJson.workspaces.push(relativePath);
        await fs.writeJson(rootPackageJsonPath, rootPackageJson, { spaces: 2 });
        console.log(chalk.cyan('Added to workspaces...'));
      }
      
      console.log(chalk.cyan('Linking workspace dependencies...'));
      execSync('bun install', {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
    } else {
      console.log(chalk.cyan('Installing dependencies...'));
      execSync('bun install', {
        cwd: targetPath,
        stdio: 'inherit',
      });
    }

    console.log(chalk.green('\n✓ Project created successfully!\n'));
    console.log(chalk.bold('Next steps:\n'));
    console.log(chalk.cyan(`  cd ${path.relative(process.cwd(), targetPath)}`));
    console.log(chalk.cyan('  bun run src/index.tsx --agent example\n'));
  } catch (error) {
    console.error(chalk.red('\nError creating project:'), error);
    process.exit(1);
  }
}

async function createAgent(
  name: string,
  targetDir: string,
  capabilities?: Capability[],
  shouldPrompt: boolean = false
) {
  const templatePath = getTemplatePath();
  
  // Check if template directory exists
  if (!(await fs.pathExists(templatePath))) {
    console.error(chalk.red('Error: Template directory not found!'));
    console.error(chalk.gray(`Expected at: ${templatePath}`));
    process.exit(1);
  }

  // Determine the target path
  const currentDir = path.resolve(targetDir);
  
  // Detect if we're in an existing aiter project
  const context = await detectContext(currentDir);

  let finalCapabilities = capabilities || [];

  // Handle interactive mode (only if capabilities weren't explicitly specified)
  if (shouldPrompt) {
    finalCapabilities = await promptForCapabilities();
  }

  if (!context.isAiterProject) {
    // Not in an aiter project - create new project with agent
    const targetPath = path.resolve(targetDir, name);
    
    // Check if target directory already exists
    if (await fs.pathExists(targetPath)) {
      console.error(chalk.red(`Error: Directory ${targetPath} already exists!`));
      process.exit(1);
    }

    console.log(chalk.blue('\nCreating new project with agent...'));
    console.log(chalk.gray(`Target: ${targetPath}`));
    console.log(chalk.gray(`Agent: ${name}\n`));

    await createProjectWithAgent(targetPath, name, finalCapabilities, templatePath);

    console.log(chalk.green('\n✓ Project created successfully!\n'));
    console.log(chalk.bold('Next steps:\n'));
    console.log(chalk.cyan(`  cd ${path.relative(process.cwd(), targetPath)}`));
    console.log(chalk.cyan(`  bun run src/index.tsx --agent ${name}\n`));
  } else {
    // Existing aiter project
    console.log(chalk.blue('\n✓ Detected existing aiter project\n'));

    const agentExists = context.agents.includes(name);

    if (agentExists) {
      // Add capabilities to existing agent
      console.log(chalk.cyan(`Adding capabilities to agent: ${name}`));
      const agentPath = path.join(currentDir, 'src/ai/agents', name);
      const templateAgentPath = path.join(templatePath, 'src/ai/agents/template');
      
      await addCapabilities(agentPath, finalCapabilities, templateAgentPath);
      
      console.log(chalk.green('\n✓ Done!\n'));
    } else {
      // Create new agent in existing project
      console.log(chalk.cyan(`Creating new agent: ${name}`));
      
      await createAgentInProject(currentDir, name, finalCapabilities, templatePath);
      
      console.log(chalk.green('\n✓ Agent created successfully!\n'));
      console.log(chalk.bold('Next steps:\n'));
      console.log(chalk.cyan(`  bun run src/index.tsx --agent ${name}\n`));
    }
  }
}

// Parse CLI arguments
yargs(hideBin(process.argv))
  .command(
    'app <name>',
    'Create a new aiter app',
    (yargs) => {
      return yargs
        .positional('name', {
          type: 'string',
          description: 'Project name',
          demandOption: true,
        })
        .option('path', {
          alias: 'p',
          type: 'string',
          description: 'Target directory path',
          default: '.',
        });
    },
    async (argv) => {
      await createApp(argv.name as string, argv.path as string);
    }
  )
  .command(
    'agent <name>',
    'Create a new agent or add to existing project',
    (yargs) => {
      return yargs
        .positional('name', {
          type: 'string',
          description: 'Agent name',
          demandOption: true,
        })
        .option('path', {
          alias: 'p',
          type: 'string',
          description: 'Target directory path',
          default: '.',
        })
        .option('capabilities', {
          alias: 'c',
          type: 'array',
          description: 'Capabilities to include (commands, tools, mcps, system-prompts, all)',
        })
        .option('interactive', {
          alias: 'i',
          type: 'boolean',
          description: 'Interactive mode',
          default: true,
        });
    },
    async (argv) => {
      let capabilities: Capability[] = [];
      let shouldPrompt = false;
      
      if (argv.capabilities) {
        const requested = argv.capabilities as string[];
        capabilities = resolveCapabilities(requested);
        const { valid, invalid } = validateCapabilities(capabilities);
        
        if (invalid.length > 0) {
          console.error(chalk.red(`Error: Unknown capabilities: ${invalid.join(', ')}`));
          process.exit(1);
        }
        
        capabilities = valid;
      } else if (argv.interactive) {
        shouldPrompt = true;
      }
      
      await createAgent(
        argv.name as string,
        argv.path as string,
        capabilities,
        shouldPrompt
      );
    }
  )
  .command(
    'component',
    'Customize components in your aiter project',
    (yargs) => {
      return yargs.option('path', {
        alias: 'p',
        type: 'string',
        description: 'Target directory path',
        default: '.',
      });
    },
    async (argv) => {
      await customizeComponents(argv.path as string);
    }
  )
  .demandCommand(1, 'You must specify a command (app, agent, or component)')
  .help('h')
  .alias('h', 'help')
  .strict()
  .parse();
