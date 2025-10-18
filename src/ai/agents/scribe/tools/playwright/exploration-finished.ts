import { tool } from "ai";
import { z } from "zod";


const explorationFinishedToolInputSchema = z.object({
});

const explorationFinishedToolOutputSchema = z.object({
  response: z.string(),
});


export const playwright_exploration_finished = tool({
  name: 'playwright_exploration_finished',
  description: `Signal completion of Playwright exploration and return to main agent.

CRITICAL: Create INDIVIDUAL SNIPPETS (standalone single-purpose scripts), NOT integrated code.

ONLY call when ALL true:
- Exploration complete (navigation, interactions, flows tested)
- All RELEVANT interactive elements tested (pagination, forms, dropdowns, dynamic content)
- Network requests analyzed for API endpoints
- Individual standalone snippets created per functionality (not combined)
- EVERY snippet tested IMMEDIATELY after creation with execute_snippet
- Test results documented with technical insights and reasoning
- Implementation recommendation (API/HTML/Hybrid) based on logical analysis
- All TODO items completed
- Summary provided with technical reasoning

DO NOT call if:
- Exploration incomplete
- Relevant interactions not tested
- Integrated/combined code created instead of individual snippets
- Snippets not tested immediately after creation
- Test results not documented with reasoning
- Recommendation not based on logical analysis
- TODOs pending or in-progress`,
  inputSchema: explorationFinishedToolInputSchema,
  outputSchema: explorationFinishedToolOutputSchema,
  execute: async () => {
    return {
      response: 'Playwright exploration finished',
    };
  }
});