import { execSync } from "child_process";
import fs from "fs";
import { getErrorStatusResponseMessage } from "./utils";
import { SnippetSchema } from "@/lib/schema";
import { z } from "zod";



export function lintPython(fpath: string, content?: string){
  let contentToLint = content;
  if (!content) {
    contentToLint = fs.readFileSync(fpath, 'utf8');
  }
  try{
    execSync(`cd ${process.env.CODE_PATH!}; ruff check -q --stdin-filename ${fpath} -`,
      {input: contentToLint, stdio: 'pipe', encoding: 'utf8'}
    );
  }
  catch(error: any){
    if (error.status!==0) {
      return `STDOUT: ${error.stdout.toString()}\nSTDERR: ${error.stderr.toString()}`;
    }
  }
  return null;
}


export function formatPython(fpath: string){
  return execSync(`cd ${process.env.CODE_PATH!}; ruff format -q ${fpath}`,
    {stdio: 'pipe', encoding: 'utf8'}
  );
}


export function executePythonSnippet(snippet: z.infer<typeof SnippetSchema>, args: string){
  return execSync(`cd ${process.env.CODE_PATH!}; uv run python - ${args}`, 
    {input: snippet.content, stdio: 'pipe', encoding: 'utf8'}
  );
}


function filePathToModule(filepath: string): string {
  return filepath
    .replace(/\\/g, '/')
    .replace(/\.py$/, '')
    .replace(/\//g, '.');
}


export function executePythonFile(fpath: string, args: string){
  return execSync(`cd ${process.env.CODE_PATH!}; uv run -m ${filePathToModule(fpath)} ${args}`, 
    {stdio: 'pipe', encoding: 'utf8'}
  );
}


export function cropCode(code: string, startLine: number=0, numLines: number=25){
  const splitCode = code.split('\n');
  if (startLine > splitCode.length){
    return getErrorStatusResponseMessage(`Start line is greater than the number of lines in the code!`);
  }
  if (startLine + numLines > splitCode.length){
    numLines = splitCode.length - startLine;
  }
  const croppedCode = splitCode.slice(startLine, startLine + numLines);
  return croppedCode.join('\n');
}


export function addLineNumbersToCode(code: string, startLine: number=0){
  const splitCode = code.split('\n');
  if (splitCode.length === 0 && code.startsWith('ERROR:')){
    return code;
  }
  return splitCode.map((line, index) => `${startLine + index}: ${line}`).join('\n');
}