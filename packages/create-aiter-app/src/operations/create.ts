import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { CORE_FILES, type Capability } from '../capabilities/registry.js';
import { copyCapability } from '../capabilities/operations.js';

export async function createProjectWithAgent(
  targetPath: string,
  agentName: string,
  capabilities: Capability[],
  templatePath: string
): Promise<void> {
  console.log(chalk.cyan('Copying base project files...'));

  // Copy base project structure (excluding agents directory for now)
  await fs.copy(templatePath, targetPath, {
    filter: (src: string) => {
      // Exclude the agents directory from initial copy
      const relativePath = path.relative(templatePath, src);
      return !relativePath.startsWith('src/ai/agents/');
    },
  });

  // Create agent directory structure
  const agentPath = path.join(targetPath, 'src/ai/agents', agentName);
  await fs.ensureDir(agentPath);

  // Copy core files from template agent
  const templateAgentPath = path.join(templatePath, 'src/ai/agents/template');
  console.log(chalk.cyan(`Creating agent: ${agentName}`));

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

  // Update package.json with project name
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = path.basename(targetPath);

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

