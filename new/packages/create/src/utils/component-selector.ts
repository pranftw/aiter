import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ComponentMap } from './component-operations';
import { buildComponentTree, flattenTree, getAllComponentsInDirectory, findNodeByPath } from './component-tree';

export interface SyncResult {
  toAdd: string[];
  toRemove: string[];
  unchanged: string[];
}

interface Choice {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean | string;
}

/**
 * Interactive component selector with checkbox UI
 */
export async function selectComponentsStateful(
  packageComponents: ComponentMap,
  currentlyCustomized: Set<string>
): Promise<SyncResult> {
  // Build tree structure
  const tree = buildComponentTree(packageComponents);
  const flattened = flattenTree(tree, currentlyCustomized);
  
  // Build choices for inquirer
  const choices: Choice[] = [];
  
  for (const { node, isLast, prefix } of flattened) {
    if (node.type === 'directory') {
      // Directory (selectable - selects all components within)
      const branchChar = isLast ? '└── ' : '├── ';
      const componentsInDir = getAllComponentsInDirectory(node);
      const allCustomized = componentsInDir.every((path) => currentlyCustomized.has(path));
      const statusIcon = allCustomized && componentsInDir.length > 0 ? chalk.green('✓') : ' ';
      const displayName = chalk.bold.cyan(`${prefix}${branchChar}${statusIcon} ${node.name}/`);
      
      choices.push({
        name: displayName,
        value: `dir:${node.path}`,
        checked: allCustomized && componentsInDir.length > 0,
        disabled: false,
      });
    } else if (node.type === 'component') {
      // Component (selectable)
      const branchChar = isLast ? '└── ' : '├── ';
      const isCustomized = currentlyCustomized.has(node.path);
      const statusIcon = isCustomized ? chalk.green('✓') : ' ';
      const fileName = node.component?.path.endsWith('.tsx')
        ? chalk.blue(`${node.name}.tsx`)
        : chalk.blue(`${node.name}.ts`);
      
      const displayName = `${prefix}${branchChar}${statusIcon} ${fileName}`;
      
      choices.push({
        name: displayName,
        value: node.path,
        checked: isCustomized,
      });
    }
  }
  
  console.log(chalk.bold('\nSelect components to customize:\n'));
  console.log(chalk.gray('Use space to select, enter to confirm\n'));
  
  // Show the selection UI
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedComponents',
      message: 'Components',
      choices,
      pageSize: 20,
    },
  ]);
  
  const selectedSet = new Set<string>();
  
  // Expand directory selections to include all components within
  for (const item of answers.selectedComponents) {
    if (item.startsWith('dir:')) {
      const dirPath = item.substring(4);
      const dirNode = findNodeByPath(tree, dirPath);
      if (dirNode) {
        const componentsInDir = getAllComponentsInDirectory(dirNode);
        componentsInDir.forEach((comp) => selectedSet.add(comp));
      }
    } else {
      selectedSet.add(item);
    }
  }
  
  // Calculate diff
  const toAdd: string[] = [];
  const toRemove: string[] = [];
  const unchanged: string[] = [];
  
  // Check what needs to be added
  for (const selected of selectedSet) {
    if (!currentlyCustomized.has(selected)) {
      toAdd.push(selected);
    } else {
      unchanged.push(selected);
    }
  }
  
  // Check what needs to be removed
  for (const current of currentlyCustomized) {
    if (!selectedSet.has(current)) {
      toRemove.push(current);
    }
  }
  
  // Show preview of changes
  if (toAdd.length > 0 || toRemove.length > 0) {
    console.log(chalk.bold('\nChanges to be made:\n'));
    
    if (toAdd.length > 0) {
      console.log(chalk.green('  Components to add:'));
      toAdd.forEach((comp) => {
        console.log(chalk.green(`    + ${comp}`));
      });
    }
    
    if (toRemove.length > 0) {
      console.log(chalk.red('\n  Components to remove:'));
      toRemove.forEach((comp) => {
        console.log(chalk.red(`    - ${comp}`));
      });
    }
    
    console.log();
    
    // Confirm changes
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Apply these changes?',
        default: true,
      },
    ]);
    
    if (!confirmAnswer.confirm) {
      console.log(chalk.yellow('\nChanges cancelled\n'));
      return {
        toAdd: [],
        toRemove: [],
        unchanged: Array.from(currentlyCustomized),
      };
    }
  } else {
    console.log(chalk.gray('\n  No changes to apply\n'));
  }
  
  return {
    toAdd,
    toRemove,
    unchanged,
  };
}

