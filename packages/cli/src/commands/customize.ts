import chalk from 'chalk';
import path from 'path';
import { detectContext } from '../utils/context';
import { promptForComponents } from '../interactive';
import { 
  getCoreComponents, 
  detectExistingComponents, 
  copyComponents 
} from '../operations/customize';

export const customizeCommand = {
  command: 'customize <resource>',
  describe: 'Customize resources in your aiter project',
  builder: (yargs: any) => {
    return yargs
      .positional('resource', {
        type: 'string',
        choices: ['components'],
        description: 'Resource to customize',
        demandOption: true,
      })
      .option('path', {
        alias: 'p',
        type: 'string',
        description: 'Project directory path',
        default: '.',
      });
  },
  handler: async (argv: any) => {
    try {
    // Validate resource type
    if (argv.resource !== 'components') {
      console.error(chalk.red(`Error: Unknown resource '${argv.resource}'`));
      process.exit(1);
    }

    const currentDir = path.resolve(argv.path);
    const context = await detectContext(currentDir);

    // Check if in an aiter project
    if (!context.isAiterProject) {
      console.error(chalk.red('\nError: Not in an aiter project!'));
      console.error(chalk.gray('To customize components, you must be in an existing aiter project.'));
      console.error(chalk.gray('To create a new project, use: bunx @aiter/cli create <name>\n'));
      process.exit(1);
    }

    console.log(chalk.blue('\n✓ Detected aiter project\n'));

    // Get core components list from @aiter/ui
    const available = getCoreComponents();
    
    // Detect existing components in the project
    const existing = await detectExistingComponents(currentDir);
    
    // Show interactive selection prompt
    const selected = await promptForComponents(available, existing);

    console.log();

    // Copy selected components from @aiter/ui
      await copyComponents(currentDir, selected, existing);

    console.log(chalk.green('\n✓ Done!\n'));
    } catch (error: any) {
      if (error?.name === 'ExitPromptError') {
        process.exit(0);
      }
      throw error;
    }
  }
};

