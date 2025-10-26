import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  getPackageComponents,
  getCustomizedComponents,
  copyComponentToProject,
  removeCustomizedComponent,
  generateComponentExports,
} from '../utils/component-operations';
import { selectComponentsStateful } from '../utils/component-selector';

/**
 * Check if we're in an aiter project
 */
function isAiterProject(cwd: string): boolean {
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if @pranftw/aiter is in dependencies
  return (
    packageJson.dependencies?.['@pranftw/aiter'] ||
    packageJson.dependencies?.['@aiter/aiter'] // Legacy support
  );
}

/**
 * Main component customization command
 */
export async function customizeComponents(targetPath: string = '.'): Promise<void> {
  const cwd = path.resolve(targetPath);
  
  // Check if in aiter project
  if (!isAiterProject(cwd)) {
    console.error(
      chalk.red('\nNot in an aiter project!\n') +
        chalk.gray('   Run this command from the root of an aiter project.\n')
    );
    process.exit(1);
  }
  
  console.log(chalk.bold.cyan('\nAiter Component Customization\n'));
  
  try {
    // Load available components from package
    console.log(chalk.gray('Scanning package components...'));
    const packageComponents = getPackageComponents();
    const componentCount = Object.keys(packageComponents).length;
    console.log(chalk.green(`   Found ${componentCount} components\n`));
    
    // Load currently customized components
    const customizedComponents = getCustomizedComponents(cwd);
    
    if (customizedComponents.size > 0) {
      console.log(
        chalk.gray(`   Currently customized: ${customizedComponents.size} components\n`)
      );
    }
    
    // Launch interactive selector
    let result;
    try {
      result = await selectComponentsStateful(
        packageComponents,
        customizedComponents
      );
    } catch (error: any) {
      // Handle Ctrl+C gracefully
      if (error.name === 'ExitPromptError' || error.message?.includes('force closed')) {
        console.log(chalk.yellow('\nCancelled\n'));
        process.exit(0);
      }
      throw error;
    }
    
    // Apply changes
    if (result.toAdd.length === 0 && result.toRemove.length === 0) {
      console.log(chalk.gray('No changes to apply\n'));
      return;
    }
    
    console.log(chalk.bold('\nApplying changes...\n'));
    
    // Add new components
    for (const componentKey of result.toAdd) {
      console.log(chalk.green(`  + Adding ${componentKey}`));
      copyComponentToProject(componentKey, packageComponents, cwd);
    }
    
    // Remove components
    for (const componentKey of result.toRemove) {
      console.log(chalk.red(`  - Removing ${componentKey}`));
      removeCustomizedComponent(componentKey, cwd);
    }
    
    // Generate exports
    const finalCustomized = new Set([...result.unchanged, ...result.toAdd]);
    console.log(chalk.gray('\n  Generating component exports...'));
    generateComponentExports(finalCustomized, packageComponents, cwd);
    
    // Summary
    console.log(chalk.bold.green('\nComponent customization complete!\n'));
    
    if (finalCustomized.size > 0) {
      console.log(chalk.gray(`  Customized components: ${finalCustomized.size}`));
      console.log(
        chalk.gray('  Location: ') + chalk.cyan('src/components/')
      );
    }
    
    console.log(
      chalk.gray('\n  Tip: ') +
        chalk.white('Customize the components in src/components/ to override defaults\n')
    );
  } catch (error) {
    console.error(chalk.red('\nError customizing components:\n'));
    console.error(error);
    process.exit(1);
  }
}

