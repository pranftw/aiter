import { tool } from "ai";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { createParentDirectories, getErrorStatusResponseMessage, validatePath } from "@/utils/utils";
import { lintPython } from "@/utils/code";



const newFileToolInputSchema = z.object({
  fpath: z.string().describe(`Path of the file to create, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_scraper.py** to create file at ${path.join(process.env.CODE_PATH!, 'extractor', 'scraper.py')}`),
  content: z.string().describe('File content'),
});


const newFileToolOutputSchema = z.object({
  response: z.string(),
});


export const new_file = tool({
  name: 'new_file',
  description: `Create a new file`,
  inputSchema: newFileToolInputSchema,
  outputSchema: newFileToolOutputSchema,
  execute: async ({fpath, content}) => {
    const fullPath = path.join(process.env.CODE_PATH!, fpath);
    const {isValid, response: validatePathResponse} = validatePath(process.env.CODE_PATH!, fullPath);
    if (!isValid) {
      return {
        response: getErrorStatusResponseMessage(validatePathResponse),
      };
    }
    if (fpath.endsWith('.py')) {
      const lintResult = lintPython(fullPath, content);
      if (lintResult) {
        return {
          response: getErrorStatusResponseMessage(lintResult),
        };
      }
    }
    createParentDirectories(fullPath);
    fs.writeFileSync(fullPath, content);
    return {
      response: `File created`,
    };
  }
});