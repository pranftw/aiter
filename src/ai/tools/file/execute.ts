import { executePythonFile, lintPython } from "@/utils/code";
import { getErrorStatusResponseMessage, validatePath } from "@/utils/utils";
import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";



const executeFileToolInputSchema = z.object({
  fpath: z.string().describe(`Path of the file to execute, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_scraper.py** to execute file at ${path.join(process.env.CODE_PATH!, 'extractor', 'scraper.py')}.`),
  args: z.string().optional().default('').describe('Command line arguments to pass while executing. For example, specify **--arg1 foo --arg2 bar** to pass arguments.'),
});


const executeFileToolOutputSchema = z.object({
  response: z.string(),
})


export const execute_file = tool({
  name: 'execute_file',
  description: `Execute a file`,
  inputSchema: executeFileToolInputSchema,
  outputSchema: executeFileToolOutputSchema,
  execute: async ({fpath, args}) => {
    if (args.includes('--output')) {
      return {
        response: getErrorStatusResponseMessage(`--output should not be used. It is reserved only for production run. Please remove it from the arguments.`),
      }
    }
    const fpathSplit = fpath.split('/');
    if (fpathSplit.includes('.') || fpathSplit.includes('..')) {
      return {
        response: getErrorStatusResponseMessage(`Using relative paths like . and .. in the file path is prohibited.`),
      };
    }
    const fullPath = path.join(process.env.CODE_PATH!, fpath);
    const {isValid, response: validatePathResponse} = validatePath(process.env.CODE_PATH!, fullPath);
    if (!isValid) {
      return {
        response: getErrorStatusResponseMessage(validatePathResponse),
      };
    }
    if (!fs.existsSync(fullPath)) {
      return {
        response: getErrorStatusResponseMessage(`File does not exist!`),
      };
    }
    if (fpath.endsWith('.py')) {
      const lintResult = lintPython(fullPath);
      if (lintResult) {
        return {
          response: lintResult,
        };
      }
      const result = executePythonFile(fpath, args);
      return {
        response: result,
      };
    }
    return {
      response: getErrorStatusResponseMessage(`Executor not implemented for this file type.`),
    };
  }
});