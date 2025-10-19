import { generateText, hasToolCall, tool } from 'ai';
import {openrouter} from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import * as snippetTools from '@/ai/tools/snippet';
import * as todoTools from '@/ai/tools/todo';
import * as noteTools from '@/ai/tools/note';
import {request_human_intervention} from '../general/';
import {MCPClientManager} from '@/utils/mcp-manager';
import { getPrompt, getMCPJSON } from '@/utils/ai';
import { ToolContextSchema, SubagentToolCallStatusSchema } from '@/lib/schema';
import { playwright_exploration_finished } from './exploration-finished';
import { updateChatMessages } from '@/utils/chat';


const explorePlaywrightToolInputSchema = z.object({
});


const explorePlaywrightToolOutputSchema = z.object({
  response: z.string(),
});


export const explore_playwright = tool({
  name: 'explore_playwright',
  description: `Launch a specialized Playwright exploration sub-agent to navigate and analyze websites. Creates self-contained code snippets for each functionality and returns structured exploration results with implementation recommendations.

PLAYWRIGHT MCP CAPABILITIES:
The sub-agent has access to browser automation tools including:
- Navigation: Navigate to URLs, take screenshots, analyze page structure
- Interaction: Click elements, fill forms, submit data, handle dropdowns
- Network Analysis: Monitor all network requests/responses to discover API endpoints
- Element Verification: Verify HTML element presence and accessibility for robust scraping
- Dynamic Content: Handle JavaScript-rendered content and AJAX interactions`,
  inputSchema: explorePlaywrightToolInputSchema,
  outputSchema: explorePlaywrightToolOutputSchema,
  execute: async ({}, {messages, toolCallId, experimental_context: context}) => {
    const {chatId, writer, agent, messages: uiMessages} = context as z.infer<typeof ToolContextSchema>;
    const mcpManager = new MCPClientManager();
    await mcpManager.initialize(getMCPJSON(agent, 'explore-playwright'));
    const mcpTools = mcpManager.tools;
    const localTools = {
      ...snippetTools,
      ...todoTools,
      ...noteTools,
      request_human_intervention,
      playwright_exploration_finished
    };
    const tools = {
      ...mcpTools,
      ...localTools,
    };

    const result = await generateText({
      model: openrouter(process.env.EXPLORE_PLAYWRIGHT_AGENT_MODEL!),
      system: getPrompt(`src/ai/agents/${agent}/system-prompts/explore-playwright.md`),
      tools: tools,
      messages: messages,
      stopWhen: [
        hasToolCall('request_human_intervention'),
        hasToolCall('playwright_exploration_finished'),
      ],
      experimental_context: {
        chatId: chatId,
        writer: writer,
        agent: agent,
        messages: uiMessages,
        creatorId: toolCallId,
      } satisfies z.infer<typeof ToolContextSchema>,
      onStepFinish: async ({toolCalls}) => {
        for (const toolCall of toolCalls){
          writer.write({
            type: 'data-subagent-tool-call',
            id: toolCall.toolCallId,
            data: {
              id: toolCall.toolCallId,
              toolName: toolCall.toolName,
              toolInput: toolCall.input
            } satisfies z.infer<typeof SubagentToolCallStatusSchema>
          })
        }
      }
    })
    if (result.finishReason==='tool-calls'){
      const lastToolCall = result.toolCalls[result.toolCalls.length-1];
      if (lastToolCall && lastToolCall.toolName==='request_human_intervention'){
        await updateChatMessages(chatId, uiMessages) // update earlier messages because if there is a human intervention and we exit then we dont transfer control back to the main agent
        await mcpManager.cleanup();
        process.exit(0);
      }
    }
    await mcpManager.cleanup();
    return {
      response: `Exploration finished. Must and should refer to the notes and snippets created during exploration using preview tools (specify creatorId as ${toolCallId}).`,
    };
  }
});