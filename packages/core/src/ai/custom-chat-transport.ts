import {
  type UIMessage,
  type ChatTransport,
  type ChatRequestOptions,
  type UIMessageChunk,
  type createUIMessageStream
} from 'ai';

export type StreamFunctionArgsType = any[];
export type StreamFunctionType = (...args: StreamFunctionArgsType) => Promise<ReturnType<typeof createUIMessageStream>>;
export type StreamFunctionOptionsType = {
  trigger: 'submit-message' | 'regenerate-message';
  chatId: string;
  messageId: string | undefined;
  messages: UIMessage[];
  abortSignal: AbortSignal | undefined;
} & ChatRequestOptions;

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private streamFunction: StreamFunctionType;
  private streamFunctionArgs: StreamFunctionArgsType;

  constructor(streamFunction: StreamFunctionType, streamFunctionArgs?: StreamFunctionArgsType) {
    this.streamFunction = streamFunction;
    this.streamFunctionArgs = streamFunctionArgs || [];
  }

  async sendMessages(
    options: StreamFunctionOptionsType,
  ): Promise<ReadableStream<UIMessageChunk>> {
    return await this.streamFunction(...this.streamFunctionArgs, options);
  }

  async reconnectToStream(
    options: {
      /** Unique identifier for the chat session to reconnect to */
      chatId: string;
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}