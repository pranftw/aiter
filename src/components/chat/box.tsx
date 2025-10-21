import { colors } from "@/utils/colors";
import { type useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { createTriggerManager } from "@/triggers";
import type { TriggerDefinition } from "@/triggers/core/types";
import type { SlashCommand } from "@/triggers/commands/types";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
  agent: string;
  onSubmit?: () => void;
  onTriggerStateChange?: (state: TriggerState | null) => void;
}

export interface TriggerState {
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
  onCommandSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function ChatBox({ chatHook, agent, onSubmit, onTriggerStateChange }: ChatBoxProps) {
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
          const newState = null;
          setTriggerState(newState);
          onTriggerStateChange?.(newState);
          return;
        }

        // Same trigger still active - just update query for client-side filtering
        if (prevTrigger?.pattern === trigger.pattern) {
          setTriggerState((prev) => {
            const newState = prev ? { ...prev, query: message, onCommandSelect: handleCommandSelect, onClose: handleTriggerClose } : null;
            onTriggerStateChange?.(newState);
            return newState;
          });
        }
        // New trigger activated - fetch suggestions
        else {
          const loadingState: TriggerState = {
            trigger,
            data: [],
            query: message,
            loading: true,
            error: null,
            onCommandSelect: handleCommandSelect,
            onClose: handleTriggerClose,
          };
          setTriggerState(loadingState);
          onTriggerStateChange?.(loadingState);

          try {
            const suggestions = await trigger.getSuggestions(message);
            if (!suggestions || suggestions.length === 0) {
              const newState = null;
              setTriggerState(newState);
              onTriggerStateChange?.(newState);
              return;
            }
            const newState: TriggerState = {
              trigger,
              data: suggestions as SlashCommand[],
              query: message,
              loading: false,
              error: null,
              onCommandSelect: handleCommandSelect,
              onClose: handleTriggerClose,
            };
            setTriggerState(newState);
            onTriggerStateChange?.(newState);
          } catch (error) {
            const errorState: TriggerState = {
              trigger,
              data: [],
              query: message,
              loading: false,
              error: {
                message: 'Failed to load suggestions',
              },
              onCommandSelect: handleCommandSelect,
              onClose: handleTriggerClose,
            };
            setTriggerState(errorState);
            onTriggerStateChange?.(errorState);
          }
        }
      } else {
        // No trigger - hide window
        const newState = null;
        setTriggerState(newState);
        onTriggerStateChange?.(newState);
      }
    };

    handleTriggerDetection();
  }, [message, triggerManager, onTriggerStateChange]);

  const handleTriggerClose = () => {
    const newState = null;
    setTriggerState(newState);
    onTriggerStateChange?.(newState);
  };

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
        const errorState: TriggerState = {
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
          onCommandSelect: handleCommandSelect,
          onClose: handleTriggerClose,
        };
        setTriggerState(errorState);
        onTriggerStateChange?.(errorState);
      } else {
        const newState = null;
        setTriggerState(newState);
        onTriggerStateChange?.(newState);
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
          const errorState: TriggerState = {
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
            onCommandSelect: handleCommandSelect,
            onClose: handleTriggerClose,
          };
          setTriggerState(errorState);
          onTriggerStateChange?.(errorState);
        } else {
          // Success - clear trigger state
          const newState = null;
          setTriggerState(newState);
          onTriggerStateChange?.(newState);
          onSubmit?.();
        }
        return;
      }
    }
    
    // Not a trigger, send as normal message
    sendMessage({ text: message });
    setMessage('');
    const newState = null;
    setTriggerState(newState);
    onTriggerStateChange?.(newState);
    onSubmit?.();
  };

  return (
    <box margin={0} padding={2} paddingTop={1} backgroundColor={colors.background.secondary}>
      <input
        placeholder='Type a message...'
        value={message}
        focused
        onInput={setMessage}
        onSubmit={handleSubmit}
        onPaste={setMessage}
        backgroundColor={colors.background.secondary}
      />
    </box>
  )
}