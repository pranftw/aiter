import { getErrorStatusResponseMessage, validatePath } from "@/utils/utils";
import { tool } from "ai";
import path from "path";
import { z } from "zod";
import fs from "fs";
import { lintPython } from "@/utils/code";


const editFileToolInputSchema = z.object({
  fpath: z.string().describe(`Path of the file to edit, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_scraper.py** to edit file at ${path.join(process.env.CODE_PATH!, 'extractor', 'scraper.py')}`),
  strToReplace: z.string().describe('The exact literal text to replace. CRITICAL: Must uniquely identify the single instance to change. Include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. If this string matches multiple locations or does not match exactly, the tool will fail.'),
  strToReplaceWith: z.string().describe('The exact literal text to replace strToReplace with. Ensure the resulting code is correct and idiomatic.')
});


const editFileToolOutputSchema = z.object({
  response: z.string(),
});


export const edit_file = tool({
  name: 'edit_file',
  description: `Edit a file by replacing exact literal text. This tool requires providing significant context around the change to ensure precise targeting. Always examine the file\'s current content before attempting a text replacement.`,
  inputSchema: editFileToolInputSchema,
  outputSchema: editFileToolOutputSchema,
  execute: async ({fpath, strToReplace, strToReplaceWith}) => {
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
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes(strToReplace)) {
      return {
        response: getErrorStatusResponseMessage(`Failed to edit, could not find the string to replace. The exact text in strToReplace was not found. Ensure you're not escaping content incorrectly and check whitespace, indentation, and context. Include at least 3 lines of context before and after the target text.`),
      };
    }
    const editedContent = content.replace(strToReplace, strToReplaceWith);
    if (fpath.endsWith('.py')) {
      const lintResult = lintPython(fullPath, editedContent);
      if (lintResult) {
        return {
          response: getErrorStatusResponseMessage(lintResult),
        };
      }
    }
    fs.writeFileSync(fullPath, editedContent);
    return {
      response: `File edited!`,
    };
  }
});