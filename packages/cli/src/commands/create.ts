import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { createTemplateCopyFilter } from '../operations/create';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get template path - check both production (./template) and dev (../template) locations
function getTemplatePath(): string {
  // When bundled into index.js: __dirname = package root -> template is at ./template
  const prodPath = path.join(__dirname, 'template');
  // When running from dev src: src/commands/create.ts -> ../../template = template/
  const devPath = path.join(__dirname, '..', '..', 'template');
  
  // Check production path first (when running from bundled code)
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

export const createCommand = {
  command: 'create <type> <name>',
  describe: 'Create a new aiter resource',
  builder: (yargs: any) => {
    return yargs
      .positional('type', {
        type: 'string',
        description: 'Resource type to create',
        choices: ['app'],
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
        description: 'Target directory path',
        default: '.',
      });
  },
  handler: async (argv: any) => {
    // Validate type
    if (argv.type !== 'app') {
      console.error(chalk.red(`Error: Unknown resource type '${argv.type}'. Valid types: app`));
      process.exit(1);
    }
    
    // Create app
    const targetPath = path.resolve(argv.path, argv.name);
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
      await fs.copy(templatePath, targetPath, {
        filter: createTemplateCopyFilter(templatePath)
      });

      // Create empty chats directory with .gitkeep
      const chatsDir = path.join(targetPath, 'chats');
      await fs.ensureDir(chatsDir);
      await fs.writeFile(path.join(chatsDir, '.gitkeep'), '');

      // Clean up tsconfig.json for standalone app (remove monorepo-specific paths)
      const tsconfigPath = path.join(targetPath, 'tsconfig.json');
      if (await fs.pathExists(tsconfigPath)) {
        const tsconfig = await fs.readJson(tsconfigPath);
        
        // Remove monorepo-specific path mappings
        if (tsconfig.compilerOptions?.paths?.['@/*']) {
          tsconfig.compilerOptions.paths['@/*'] = ['./src/*'];
        }
        
        await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
      }

      // Update package.json with project name and replace workspace dependencies
      const packageJsonPath = path.join(targetPath, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = argv.name;
      
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
};

