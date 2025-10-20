import { colors } from "@/utils/colors";
import { type useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { createTriggerManager } from "@/triggers";
import type { TriggerDefinition } from "@/triggers/core/types";
import type { SlashCommand } from "@/triggers/commands/types";
import { TriggerWindow } from "@/components/triggers/core";
import { CommandSuggestions } from "@/components/triggers/commands";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
  agent: string;
  onSubmit?: () => void;
}

interface TriggerState {
  trigger: TriggerDefinition;
  data: SlashCommand[];
  query: string;
  loading: boolean;
  error: {
    message: string;
    usage?: string;
    examples?: string[];
    commandName?: string;
  } | null;
}

export function ChatBox({ chatHook, agent, onSubmit }: ChatBoxProps) {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');
  const [triggerManager] = useState(() => createTriggerManager({ agent }));
  const [triggerState, setTriggerState] = useState<TriggerState | null>(null);
  const skipNextSubmitRef = useRef(false);

  // Handle trigger detection on input changes
  useEffect(() => {
    const handleTriggerDetection = async () => {
      const trigger = triggerManager.detectTrigger(message);
      const prevTrigger = triggerState?.trigger;

      if (trigger) {
        // If typing arguments after a command, close trigger window
        const isSlashWithArgs = message.startsWith('/') && message.slice(1).includes(' ');
        if (isSlashWithArgs) {
          setTriggerState(null);
          return;
        }

        // Same trigger still active - just update query for client-side filtering
        if (prevTrigger?.pattern === trigger.pattern) {
          setTriggerState((prev) => (prev ? { ...prev, query: message } : null));
        }
        // New trigger activated - fetch suggestions
        else {
          setTriggerState({
            trigger,
            data: [],
            query: message,
            loading: true,
            error: null,
          });

          try {
            const suggestions = await trigger.getSuggestions(message);
            if (!suggestions || suggestions.length === 0) {
              setTriggerState(null);
              return;
            }
            setTriggerState({
              trigger,
              data: suggestions as SlashCommand[],
              query: message,
              loading: false,
              error: null,
            });
          } catch (error) {
            setTriggerState({
              trigger,
              data: [],
              query: message,
              loading: false,
              error: {
                message: 'Failed to load suggestions',
              },
            });
          }
        }
      } else {
        // No trigger - hide window
        setTriggerState(null);
      }
    };

    handleTriggerDetection();
  }, [message, triggerManager]);

  const handleCommandSelect = async (command: SlashCommand) => {
    const cmdText = `/${command.name}`;
    skipNextSubmitRef.current = true;
    const trigger = triggerManager.detectTrigger(cmdText);
    if (!trigger) return;

    const result = await triggerManager.execute(cmdText, {
      chatHook,
      rawInput: cmdText,
      triggerChar: trigger.pattern,
      metadata: { agent },
    });

    if (result.wasTriggered) {
      setMessage('');
      if (!result.success && result.error) {
        setTriggerState({
          trigger,
          data: triggerState?.data || [],
          query: '',
          loading: false,
          error: {
            message: result.error,
            usage: result.data?.usage,
            examples: result.data?.examples,
            commandName: result.data?.commandName,
          },
        });
      } else {
        setTriggerState(null);
        onSubmit?.();
      }
    }
  };

  const handleSubmit = async () => {
    if (skipNextSubmitRef.current) {
      skipNextSubmitRef.current = false;
      return;
    }
    if (status !== 'ready' || message.trim() === '') return;
    
    // Check if this is a trigger
    const trigger = triggerManager.detectTrigger(message);
    if (trigger) {
      // Execute the trigger
      const result = await triggerManager.execute(message, {
        chatHook,
        rawInput: message,
        triggerChar: trigger.pattern,
        metadata: { agent },
      });
      
      if (result.wasTriggered) {
        // Clear the input
        setMessage('');
        
        // Show error if execution failed
        if (!result.success && result.error) {
          setTriggerState({
            trigger,
            data: triggerState?.data || [],
            query: '',
            loading: false,
            error: {
              message: result.error,
              usage: result.data?.usage,
              examples: result.data?.examples,
              commandName: result.data?.commandName,
            },
          });
        } else {
          // Success - clear trigger state
          setTriggerState(null);
          onSubmit?.();
        }
        return;
      }
    }
    
    // Not a trigger, send as normal message
    sendMessage({ text: message });
    setMessage('');
    setTriggerState(null);
    onSubmit?.();
  };

  return (
    <box flexDirection='column-reverse' gap={1} margin={0} padding={2} paddingTop={1} backgroundColor={colors.background.secondary}>
      <input
        placeholder='Type a message...'
        value={message}
        focused
        onInput={setMessage}
        onSubmit={handleSubmit}
        onPaste={setMessage}
        backgroundColor={colors.background.secondary}
      />

      {triggerState && (
        <TriggerWindow loading={triggerState.loading} error={triggerState.error}>
          {triggerState.trigger.pattern === '/' &&
            !triggerState.loading &&
            !(triggerState.query?.startsWith('/') && triggerState.query.slice(1).includes(' ')) && (
              <CommandSuggestions commands={triggerState.data} query={triggerState.query} onSelect={handleCommandSelect} />
            )}
        </TriggerWindow>
      )}
    </box>
    // <box flexDirection='column-reverse' gap={1}>
    //   {/* Chat Input - always at bottom */}
    //   <box margin={0} padding={2} paddingTop={1} backgroundColor={colors.background.secondary}>
    //     <input
    //       placeholder='Type a message...'
    //       value={message}
    //       focused
    //       onInput={setMessage}
    //       onSubmit={handleSubmit}
    //       onPaste={setMessage}
    //       backgroundColor={colors.background.secondary}
    //     />
    //   </box>

    //   {/* Trigger Window - appears above input */}
    //   {triggerState && (
    //     <TriggerWindow loading={triggerState.loading} error={triggerState.error}>
    //       {triggerState.trigger.pattern === '/' &&
    //         !triggerState.loading &&
    //         !(triggerState.query?.startsWith('/') && triggerState.query.slice(1).includes(' ')) && (
    //         <CommandSuggestions
    //           commands={triggerState.data}
    //           query={triggerState.query}
    //           onSelect={handleCommandSelect}
    //         />
    //       )}
    //     </TriggerWindow>
    //   )}
    // </box>
  )
}