import { tool } from 'ai';
import { z } from 'zod';
import octokit from '@/lib/github';
import { ToolContextSchema } from '@/lib/schema';
import { getErrorStatusResponseMessage } from '@/utils/utils';



const issueBodySchema = z.object({
  baseURL: z.string().describe('Base URL of the website'),
  url: z.string().describe('URL of the page that is causing the issue'),
  highLevelDescription: z.string().describe('High level description of the issue'),
  technicalDescription: z.string().describe('Technical description of the issue'),
});


const requestHumanInterventionToolInputSchema = z.object({
  issueTitle: z.string().describe('Title of the Github issue to create'),
  issueBody: issueBodySchema.describe('Body of the Github issue to create'),
});


const requestHumanInterventionToolOutputSchema = z.object({
  response: z.string(),
});


function issueBodyToString(issueBody: z.infer<typeof issueBodySchema>, chatId: string) {
  const {baseURL, url, highLevelDescription, technicalDescription} = issueBody;
  return `
## Chat ID
${chatId}

## Base URL
${baseURL}

## URL
${url}

## High Level Description
${highLevelDescription}

## Technical Description
${technicalDescription}
  `;
};


export const request_human_intervention = tool({
  name: 'request_human_intervention',
  description: `Request human intervention by creating a GitHub issue. This is the ONLY acceptable way to return control to the user.

ONLY use this tool when encountering genuine unresolvable blockers:
- Website has captchas or anti-bot measures preventing exploration
- Content behind paywalls or authentication that cannot be bypassed
- Website is broken or has technical issues
- Requirements are fundamentally unclear and cannot be discovered through exploration
- After exhausting ALL exploration and implementation attempts

DO NOT use for:
- Questions that can be answered through explore_playwright
- Implementation decisions you can make autonomously
- Requesting approval or feedback on intermediate progress
- Minor issues that can be solved through additional exploration

This creates a GitHub issue requiring real human time. Use as absolute last resort.`,
  inputSchema: requestHumanInterventionToolInputSchema,
  outputSchema: requestHumanInterventionToolOutputSchema,
  execute: async ({issueTitle, issueBody}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    try {
      await octokit.rest.issues.create({
        owner: process.env.REPO_OWNER!,
        repo: process.env.REPO_NAME!,
        title: `${chatId}: ${issueTitle}`,
        body: issueBodyToString(issueBody, chatId),
      });
    }
    catch(error: any) {
      return {
        response: getErrorStatusResponseMessage(`Failed to create GitHub issue! ${error.message}`),
      };
    }
    return {
      response: 'Human intervention requested',
    };
  }
});