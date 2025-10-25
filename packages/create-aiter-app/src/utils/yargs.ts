import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface Arguments {
  path: string;
  name: string;
}

export const argv = yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Target directory path',
    default: '.',
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Project name',
    demandOption: true,
  })
  .help()
  .alias('help', 'h')
  .parseSync() as Arguments;

