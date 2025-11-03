import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { coreComponentsWithPath } from '@aiter/ui/registry';

/**
 * Get list of core components from coreComponentsWithPath
 * Maps component paths to file paths (e.g., 'chat/container' -> 'chat/container.tsx')
 */
export function getCoreComponents(): string[] {
  return Object.keys(coreComponentsWithPath).map(componentPath => {
    return `${componentPath}.tsx`;
  });
}

/**
 * Detect which components have already been customized in the project
 */
export async function detectExistingComponents(
  projectPath: string
): Promise<string[]> {
  const componentsPath = path.join(projectPath, 'src/components');
  const existing: string[] = [];
  const allComponents = getCoreComponents();

  for (const component of allComponents) {
    const filePath = path.join(componentsPath, component);
    if (await fs.pathExists(filePath)) {
      existing.push(component);
    }
  }

  return existing;
}

/**
 * Find @aiter/ui components source path using ESM module resolution
 * Works both locally (workspace) and when installed from npm
 */
async function getUIComponentsPath(): Promise<string> {
  try {
    // Use import.meta.resolve to find @aiter/ui package
    const uiPackageUrl = await import.meta.resolve('@aiter/ui/package.json');
    const uiPackagePath = uiPackageUrl.replace('file://', '');
    const uiPackageDir = path.dirname(uiPackagePath);
    
    // Components are in src/components (copied during UI build)
    const componentsPath = path.join(uiPackageDir, 'src/components');
    
    if (!fs.existsSync(componentsPath)) {
      throw new Error(`Components directory not found at ${componentsPath}`);
    }
    
    return componentsPath;
  } catch (error) {
    console.error(chalk.red('Error: Could not locate @aiter/ui package'));
    console.error(chalk.gray('Make sure @aiter/ui is installed as a dependency'));
    throw error;
  }
}

/**
 * Copy selected components from @aiter/ui to the project
 * Prompts for overwrite if file already exists
 * Deletes existing files that were deselected
 */
export async function copyComponents(
  projectPath: string,
  selectedPaths: string[],
  existingPaths: string[] = []
): Promise<void> {
  const sourceBase = await getUIComponentsPath();
  const targetBase = path.join(projectPath, 'src/components');

  // Handle deselected files (existing files not in selection)
  const deselected = existingPaths.filter(path => !selectedPaths.includes(path));
  
  for (const componentPath of deselected) {
    const targetPath = path.join(targetBase, componentPath);
    
    const shouldDelete = await confirm({
      message: `${componentPath} is deselected. Delete it?`,
      default: false,
    });

    if (shouldDelete) {
      await fs.remove(targetPath);
      console.log(chalk.red(`  ✓ Deleted ${componentPath}`));
    } else {
      console.log(chalk.gray(`  - Kept ${componentPath}`));
    }
  }

  // Copy selected components
  for (const componentPath of selectedPaths) {
    const sourcePath = path.join(sourceBase, componentPath);
    const targetPath = path.join(targetBase, componentPath);

    // Check if source exists
    if (!await fs.pathExists(sourcePath)) {
      console.error(chalk.red(`  ✗ Source not found: ${componentPath}`));
      continue;
    }

    // Check if file exists in target
    const exists = await fs.pathExists(targetPath);
    
    if (exists) {
      const shouldOverwrite = await confirm({
        message: `${componentPath} already exists. Overwrite?`,
        default: false,
      });

      if (!shouldOverwrite) {
        console.log(chalk.gray(`  - Skipped ${componentPath}`));
        continue;
      }
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(targetPath));

    // Copy file as-is from @aiter/ui
    await fs.copy(sourcePath, targetPath);
    console.log(chalk.green(`  ✓ ${exists ? 'Overwrote' : 'Copied'} ${componentPath}`));
  }
}

