#!/usr/bin/env bun

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createCommand } from './commands/create';
import { addCommand } from './commands/add';

yargs(hideBin(process.argv))
  .scriptName('@aiter/cli')
  .usage('$0 <command> [options]')
  .command(createCommand)
  .command(addCommand)
  .demandCommand(1, 'You must specify a command')
  .help('h')
  .alias('h', 'help')
  .strict()
  .parse();
