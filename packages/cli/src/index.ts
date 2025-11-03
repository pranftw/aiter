#!/usr/bin/env bun

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createCommand } from './commands/create';
import { addCommand } from './commands/add';
import { customizeCommand } from './commands/customize';

yargs(hideBin(process.argv))
  .scriptName('@aiter/cli')
  .usage('$0 <command> [options]')
  .command(createCommand)
  .command(addCommand)
  .command(customizeCommand)
  .demandCommand(1, 'You must specify a command')
  .help('h')
  .alias('h', 'help')
  .strict()
  .parse();
