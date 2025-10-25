import type { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import type React from 'react';


export type ChatHook = ReturnType<typeof useChat>;
export type AIMessageComponent = (props: { message: UIMessage }) => React.ReactNode;