import { tool } from "ai";
import { z } from "zod";
import { ToolContextSchema } from "@/lib/schema";
import octokit from "@/lib/github";
import { getErrorStatusResponseMessage, validatePath } from "@/utils/utils";
import { RequestError } from "octokit";
import path from "path";
import fs from "fs";
import { formatPython, lintPython } from "@/utils/code";



const authoringFinishedToolInputSchema = z.object({
  fpath: z.string().describe(`File path of the scraper implementation, relative to code path at ${process.env.CODE_PATH!}. For example, specify **extractor/some_scraper.py** to create file at ${path.join(process.env.CODE_PATH!, 'extractor', 'scraper.py')}`),
});


const authoringFinishedToolOutputSchema = z.object({
  response: z.string(),
});


// Helper functions
async function checkBranchExists(branchName: string): Promise<boolean> {
  try {
    await octokit.rest.repos.getBranch({
      owner: process.env.REPO_OWNER!,
      repo: process.env.REPO_NAME!,
      branch: branchName,
    });
    return true;
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return false;
    }
    throw error;
  }
}


async function createBranch(branchName: string): Promise<void> {
  const mainSHA = await octokit.rest.repos.getBranch({
    owner: process.env.REPO_OWNER!,
    repo: process.env.REPO_NAME!,
    branch: 'main',
  }).then((res) => res.data.commit.sha);
  await octokit.rest.git.createRef({
    owner: process.env.REPO_OWNER!,
    repo: process.env.REPO_NAME!,
    ref: `refs/heads/${branchName}`,
    sha: mainSHA,
  });
}


async function validateAndReadFile(fpath: string): Promise<{ isValid: boolean, content?: string, error?: string }> {
  const fullPath = path.join(process.env.CODE_PATH!, fpath);
  const {isValid, response: validatePathResponse} = validatePath(process.env.CODE_PATH!, fullPath);
  if (!isValid) {
    return { isValid: false, error: validatePathResponse };
  }
  if (!fs.existsSync(fullPath)) {
    return { isValid: false, error: 'File does not exist!' };
  }
  const lintResult = lintPython(fullPath);
  if (lintResult) {
    return { isValid: false, error: lintResult };
  }
  const formatResult = formatPython(fpath);
  if (formatResult) {
    return { isValid: false, error: formatResult };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return { isValid: true, content };
}


async function uploadFileToGitHub(fpath: string, content: string, branchName: string, chatId: string): Promise<void> {
  // Check if file exists in the repository to determine if we need SHA for update
  let sha: string | undefined;
  try {
    const existingFile = await octokit.rest.repos.getContent({
      owner: process.env.REPO_OWNER!,
      repo: process.env.REPO_NAME!,
      path: fpath,
      ref: branchName,
    });
    // If file exists and is not a directory, get its SHA
    if (!Array.isArray(existingFile.data) && existingFile.data.type === 'file') {
      sha = existingFile.data.sha;
    }
  } catch (error) {
    // File doesn't exist, which is fine - we'll create it
    if (!(error instanceof RequestError && error.status === 404)) {
      throw error; // Re-throw if it's not a 404
    }
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.REPO_OWNER!,
    repo: process.env.REPO_NAME!,
    path: fpath,
    message: `${chatId}: ${sha ? 'Update' : 'Add'} \`${fpath}\``,
    content: Buffer.from(content).toString('base64'),
    branch: branchName,
    sha, // Will be undefined for new files, which is fine
  });
}


async function deleteExistingPullRequests(branchName: string): Promise<void> {
  const existingPRs = await octokit.rest.pulls.list({
    owner: process.env.REPO_OWNER!,
    repo: process.env.REPO_NAME!,
    head: `${process.env.REPO_OWNER}:${branchName}`,
    base: 'main',
    state: 'open',
  });
  // Close all existing PRs from this branch
  for (const pr of existingPRs.data) {
    await octokit.rest.pulls.update({
      owner: process.env.REPO_OWNER!,
      repo: process.env.REPO_NAME!,
      pull_number: pr.number,
      state: 'closed',
    });
  }
}


async function createPullRequest(fpath: string, branchName: string, chatId: string): Promise<void> {
  await octokit.rest.pulls.create({
    owner: process.env.REPO_OWNER!,
    repo: process.env.REPO_NAME!,
    base: 'main',
    head: branchName,
    title: `${chatId}: Authored \`${fpath}\``,
    body: `PR for \`${fpath}\``,
  });
}


export const authoring_finished = tool({
  name: 'authoring_finished',
  description: `Signal completion of scraper implementation and create a GitHub pull request.

ONLY call this tool when ALL of the following are true:
- Complete implementation following Scraper pattern (inherits from base Scraper class)
- All exploration snippets successfully integrated into the scraper
- Production features added: error handling, tqdm progress bars, argparse if needed
- Comprehensive end-to-end testing completed using execute_file
- All TODO items marked as 'completed' with no pending or in-progress items
- Scraper executes successfully and produces correct output
- Returns correct format: {filepath: download_url} dict
- Code follows standards: 2 space indentation, single quotes, no emojis
- Scraper is production-ready and can be deployed immediately

Do NOT call if implementation is incomplete, testing failed, or any TODO items remain unfinished.`,
  inputSchema: authoringFinishedToolInputSchema,
  outputSchema: authoringFinishedToolOutputSchema,
  execute: async ({fpath}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const branchName = `scraper/${chatId}`;
    
    try {
      // Check if branch exists, create if it doesn't
      const branchExists = await checkBranchExists(branchName);
      if (!branchExists) {
        await createBranch(branchName);
      }
      // Validate and read the file
      const fileResult = await validateAndReadFile(fpath);
      if (!fileResult.isValid) {
        return {
          response: getErrorStatusResponseMessage(fileResult.error!),
        };
      }
      // Upload file to GitHub
      await uploadFileToGitHub(fpath, fileResult.content!, branchName, chatId);
      // Delete existing PRs and create a new one
      await deleteExistingPullRequests(branchName);
      await createPullRequest(fpath, branchName, chatId);
    } catch(error: any) {
      return {
        response: getErrorStatusResponseMessage(`Failed to create GitHub pull request! ${error.message}`),
      };
    }
    
    return {
      response: 'Authoring finished',
    };
  }
});