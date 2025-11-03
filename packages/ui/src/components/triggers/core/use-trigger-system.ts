import { useState, useEffect, useRef, useMemo } from 'react';
import { createTriggerManager, type TriggerDefinition, type ChatHook } from '@aiter/core';

export interface TriggerUIData<T = any> {
  /** The active trigger */
  trigger: TriggerDefinition;
  
  /** Suggestions/data from the trigger */
  data: T[];
  
  /** Current query string */
  query: string;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Callbacks */
  onSelect: (item: T) => void;
  onClose: () => void;
  onNavigate?: (item: T | null) => void;
}

interface UseTriggerSystemProps {
  chatHook: ChatHook;
  agent: string;
  agentCommands?: Record<string, any>;
  onSubmitCallback?: () => void;
}

interface UseTriggerSystemReturn {
  message: string;
  setMessage: (msg: string) => void;
  handleSubmit: () => Promise<void>;
  activeTriggerUI: TriggerUIData | null;
}

export function useTriggerSystem({ 
  chatHook, 
  agent,
  agentCommands = {},
  onSubmitCallback 
}: UseTriggerSystemProps): UseTriggerSystemReturn {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');
  const triggerManager = useMemo(() => {
    return createTriggerManager({ agent, agentCommands });
  }, [agent, agentCommands]);
  
  // Single active trigger UI state - only ONE can be active at a time
  const [activeTriggerUI, setActiveTriggerUI] = useState<TriggerUIData | null>(null);
  const skipNextSubmitRef = useRef(false);

  // Detect and manage active trigger
  useEffect(() => {
    const handleTriggerDetection = async () => {
      const trigger = triggerManager.detectTrigger(message);
      const prevTrigger = activeTriggerUI?.trigger;

      if (trigger) {
        // Check if should close (e.g., typing args after command)
        if (shouldCloseTriggerUI(message, trigger)) {
          setActiveTriggerUI(null);
          return;
        }

        // Same trigger - just update query
        if (prevTrigger?.pattern === trigger.pattern) {
          setActiveTriggerUI((prev) => 
            prev ? { ...prev, query: message, error: null } : null
          );
        }
        // New trigger - fetch suggestions and activate
        else {
          setActiveTriggerUI({
            trigger,
            data: [],
            query: message,
            loading: true,
            error: null,
            onSelect: (item) => handleItemSelect(item, trigger),
            onClose: handleClose,
            onNavigate: (item) => handleNavigate(item, trigger),
          });

          try {
            const suggestions = await trigger.getSuggestions(message);
            if (!suggestions || suggestions.length === 0) {
              setActiveTriggerUI(null);
              return;
            }
            
            setActiveTriggerUI((prev) => prev ? {
              ...prev,
              data: suggestions,
              loading: false,
            } : null);
          } catch (error) {
            setActiveTriggerUI((prev) => prev ? {
              ...prev,
              data: [],
              loading: false,
              error: 'Failed to load suggestions',
            } : null);
          }
        }
      } else {
        // No trigger detected - clear UI only if there's no error
        // This allows errors to persist after message is cleared
        setActiveTriggerUI((prev) => {
          if (prev?.error) {
            return prev; // Keep error visible
          }
          return null;
        });
      }
    };

    handleTriggerDetection();
  }, [message, triggerManager]);

  const handleItemSelect = async (item: any, trigger: TriggerDefinition) => {
    // Item-specific logic based on trigger type
    skipNextSubmitRef.current = true;
    const cmdText = `/${item.name}`;
    
    const result = await triggerManager.execute(cmdText, {
      chatHook,
      rawInput: cmdText,
      triggerChar: trigger.pattern,
      metadata: { agent },
    });

    if (result.wasTriggered) {
      setMessage('');
      if (!result.success && result.error) {
        setActiveTriggerUI((prev) => prev ? {
          ...prev,
          query: '',
          loading: false,
          error: result.error || null,
          onNavigate: (item) => handleNavigate(item, trigger),
        } : null);
      } else {
        setActiveTriggerUI(null);
        onSubmitCallback?.();
      }
    }
  };

  const handleClose = () => {
    setActiveTriggerUI(null);
  };

  const handleNavigate = (item: any, trigger: TriggerDefinition) => {
    // When navigating through suggestions, update the message field
    if (item && trigger.pattern === '/') {
      setMessage(`/${item.name}`);
    } else if (!item && trigger.pattern === '/') {
      // When no item is selected (selectedIndex === -1), restore to just the trigger
      setMessage('/');
    }
  };

  const handleSubmit = async () => {
    if (skipNextSubmitRef.current) {
      skipNextSubmitRef.current = false;
      return;
    }
    if (status !== 'ready' || message.trim() === '') return;
    
    const trigger = triggerManager.detectTrigger(message);
    if (trigger) {
      const result = await triggerManager.execute(message, {
        chatHook,
        rawInput: message,
        triggerChar: trigger.pattern,
        metadata: { agent },
      });
      
      if (result.wasTriggered) {
        setMessage('');
        if (!result.success && result.error) {
          setActiveTriggerUI({
            trigger,
            data: activeTriggerUI?.data || [],
            query: '',
            loading: false,
            error: result.error || null,
            onSelect: (item) => handleItemSelect(item, trigger),
            onClose: handleClose,
            onNavigate: (item) => handleNavigate(item, trigger),
          });
        } else {
          setActiveTriggerUI(null);
          onSubmitCallback?.();
        }
        return;
      }
    }
    
    // Regular message
    sendMessage({ text: message });
    setMessage('');
    setActiveTriggerUI(null);
    onSubmitCallback?.();
  };

  return {
    message,
    setMessage,
    handleSubmit,
    activeTriggerUI,
  };
}

function shouldCloseTriggerUI(message: string, trigger: TriggerDefinition): boolean {
  // Close command UI when typing arguments
  if (trigger.pattern === '/' && message.startsWith('/') && message.slice(1).includes(' ')) {
    return true;
  }
  // Add more trigger-specific close conditions here
  return false;
}

