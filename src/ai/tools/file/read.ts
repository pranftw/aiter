import { tool } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { getErrorStatusResponseMessage, validatePath } from "@/utils/utils";
import { addLineNumbersToCode, cropCode } from "@/utils/code";


const readFileToolInputSchema = z.object({
  fpath: z.string().describe(`Path of the file to read, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_scraper.py** to read file at ${path.join(process.env.CODE_PATH!, 'extractor', 'scraper.py')}`),
  startLine: z.number().optional().default(0).describe('Start line of the file to read'),
  numLines: z.number().optional().default(25).describe('Number of lines of the file to read'),
  readFull: z.boolean().optional().default(false).describe('Set to true to read the full file. Use this only if you find that it is necessary to get the context of the full file.'),
});


const readFileToolOutputSchema = z.object({
  content: z.string().nullable(),
  response: z.string()
});


export const read_file = tool({
  name: 'read_file',
  description: `Read a file (includes line numbers)`,
  inputSchema: readFileToolInputSchema,
  outputSchema: readFileToolOutputSchema,
  execute: async ({fpath, startLine, numLines, readFull}) => {
    const fullPath = path.join(process.env.CODE_PATH!, fpath);
    const {isValid, response: validatePathResponse} = validatePath(process.env.CODE_PATH!, fullPath);
    if (!isValid) {
      return {
        content: null,
        response: getErrorStatusResponseMessage(validatePathResponse),
      };
    }
    if (!fs.existsSync(fullPath)) {
      return {
        content: null,
        response: getErrorStatusResponseMessage(`File does not exist!`),
      };
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!readFull) {
      content = cropCode(content, startLine, numLines);
    }
    content = addLineNumbersToCode(content, startLine);
    return {
      content: content,
      response: content.startsWith('ERROR:') ? content : `File read successfully!`,
    };
  }
});