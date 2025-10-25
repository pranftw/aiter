#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { args } from './utils/yargs.js';
import { detectContext } from './utils/context.js';
import { createProjectWithAgent, createAgentInProject } from './operations/create.js';
import { addCapabilities } from './capabilities/operations.js';
import { promptForCapabilities } from './interactive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createProjectLegacy() {
  const targetPath = path.resolve(args.path, args.name);
  const templatePath = path.join(__dirname, '..', 'template');

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
    packageJson.name = args.name;
    
    // Check if we're creating inside the aiter monorepo
    const isInMonorepo = await fs.pathExists(path.join(process.cwd(), 'packages/core/package.json'));

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

async function createProjectWithCapabilitySystem() {
  const templatePath = path.join(__dirname, '..', 'template');
  
  // Check if template directory exists
  if (!(await fs.pathExists(templatePath))) {
    console.error(chalk.red('Error: Template directory not found!'));
    console.error(chalk.gray(`Expected at: ${templatePath}`));
    process.exit(1);
  }

  // Determine the target path
  const targetPath = path.resolve(args.path, args.name);
  
  // Check if target already exists and is an aiter project
  const targetExists = await fs.pathExists(targetPath);
  const context = targetExists ? await detectContext(targetPath) : { isAiterProject: false, agents: [], projectPath: targetPath };

  let capabilities = args.capabilities;

  // Handle interactive mode (only if capabilities weren't explicitly specified)
  if (args.shouldPromptCapabilities) {
    capabilities = await promptForCapabilities();
  }

  if (!context.isAiterProject) {
    // Creating new project with agent
    
    // Check if target directory already exists
    if (targetExists) {
      console.error(chalk.red(`Error: Directory ${targetPath} already exists and is not an aiter project!`));
      process.exit(1);
    }

    console.log(chalk.blue('\nCreating new project with agent...'));
    console.log(chalk.gray(`Target: ${targetPath}`));
    console.log(chalk.gray(`Agent: ${args.agent}\n`));

    await createProjectWithAgent(targetPath, args.agent!, capabilities, templatePath);

    console.log(chalk.green('\n✓ Project created successfully!\n'));
    console.log(chalk.bold('Next steps:\n'));
    console.log(chalk.cyan(`  cd ${path.relative(process.cwd(), targetPath)}`));
    console.log(chalk.cyan(`  bun run src/index.tsx --agent ${args.agent}\n`));
  } else {
    // Existing project - add or create agent
    console.log(chalk.blue('\n✓ Detected existing aiter project\n'));

    const agentExists = context.agents.includes(args.agent!);

    if (agentExists) {
      // Add capabilities to existing agent
      console.log(chalk.cyan(`Adding capabilities to agent: ${args.agent}`));
      const agentPath = path.join(targetPath, 'src/ai/agents', args.agent!);
      const templateAgentPath = path.join(templatePath, 'src/ai/agents/template');
      
      await addCapabilities(agentPath, capabilities, templateAgentPath);
      
      console.log(chalk.green('\n✓ Done!\n'));
    } else {
      // Create new agent in existing project
      console.log(chalk.cyan(`Creating new agent: ${args.agent}`));
      
      await createAgentInProject(targetPath, args.agent!, capabilities, templatePath);
      
      console.log(chalk.green('\n✓ Agent created successfully!\n'));
      console.log(chalk.bold('Next steps:\n'));
      console.log(chalk.cyan(`  bun run src/index.tsx --agent ${args.agent}\n`));
    }
  }
}

async function main() {
  try {
    if (!args.agent) {
      // Legacy mode: copy entire template
      await createProjectLegacy();
    } else {
      // New capability system mode
      await createProjectWithCapabilitySystem();
    }
  } catch (error) {
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});

