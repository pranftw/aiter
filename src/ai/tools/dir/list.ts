import { tool } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { getErrorStatusResponseMessage, validatePath } from "@/utils/utils";



const listDirToolInputSchema = z.object({
  dirpath: z.string().describe(`Path of the directory to list, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_dir** to list directory at ${path.join(process.env.CODE_PATH!, 'extractor', 'some_dir')}`),
});


const listDirToolOutputSchema = z.object({
  response: z.string(),
});


export const list_dir = tool({
  name: 'list_dir',
  description: `List a directory`,
  inputSchema: listDirToolInputSchema,
  outputSchema: listDirToolOutputSchema,
  execute: async ({dirpath}) => {
    const fullPath = path.join(process.env.CODE_PATH!, dirpath);
    const {isValid, response: validatePathResponse} = validatePath(process.env.CODE_PATH!, fullPath);
    if (!isValid) {
      return {
        response: getErrorStatusResponseMessage(validatePathResponse),
      };
    }
    if (!fs.existsSync(fullPath)) {
      return {
        response: getErrorStatusResponseMessage(`Directory does not exist!`),
      };
    }
    if (!fs.statSync(fullPath).isDirectory()) {
      return {
        response: getErrorStatusResponseMessage(`Path is not a directory!`),
      };
    }
    const files = fs.readdirSync(fullPath);
    return {
      response: files.join('\n'),
    };
  }
});