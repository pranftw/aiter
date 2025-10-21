import type { SlashCommand } from '@/triggers/commands/types';
import { colors } from '@/utils/colors';
import { useState, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';

interface CommandSuggestionsProps {
  commands: SlashCommand[];
  query: string;
  onSelect: (command: SlashCommand) => void | Promise<void>;
  onClose?: () => void;
}

export function CommandSuggestions({ commands, query, onSelect, onClose }: CommandSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means no selection

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [commands]);

  // Close window when no commands match the query
  useEffect(() => {
    if (commands.length === 0 && query && query.length > 1) {
      onClose?.();
    }
  }, [commands.length, query, onClose]);

  // Handle keyboard navigation
  useKeyboard((key) => {
    // Only handle keys if there are commands to navigate
    if (commands.length === 0) return;

    if (key.name === 'up') {
      setSelectedIndex(prev => {
        if (prev === -1) return commands.length - 1; // From no selection to last
        if (prev === 0) return -1; // From first to no selection
        return Math.max(-1, prev - 1); // Normal up movement with bounds check
      });
      return;
    }
    if (key.name === 'down') {
      setSelectedIndex(prev => {
        if (prev === -1) return 0; // From no selection to first
        if (prev === commands.length - 1) return -1; // From last to no selection
        return Math.min(commands.length - 1, prev + 1); // Normal down movement with bounds check
      });
      return;
    }
    if (key.name === 'return') {
      // Only execute if we have a valid selection
      if (selectedIndex >= 0 && selectedIndex < commands.length) {
        const selectedCommand = commands[selectedIndex];
        if (selectedCommand) {
          onSelect(selectedCommand);
        }
      }
      // If no selection but only one command, select it
      else if (selectedIndex === -1 && commands.length === 1) {
        const firstCommand = commands[0];
        if (firstCommand) {
          onSelect(firstCommand);
        }
      }
      return;
    }
    if (key.name === 'escape') {
      // Close window on escape
      onClose?.();
      return;
    }
  });

  const getHighlightParts = (text: string, query: string) => {
    if (!query || query.length <= 1) return null;
    const searchQuery = query.slice(1).toLowerCase();
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(searchQuery);
    if (index === -1) return null;
    return {
      prefix: text.slice(0, index),
      highlight: text.slice(index, index + searchQuery.length),
      suffix: text.slice(index + searchQuery.length),
    };
  };

  // Return null when no commands to close the window
  if (commands.length === 0) {
    return null;
  }

  return (
    <box flexDirection='column' alignItems='flex-start' width='100%'>
      {commands.map((cmd, index) => {
        // Safety check: skip invalid commands
        if (!cmd || !cmd.name) return null;

        const isSelected = selectedIndex >= 0 && index === selectedIndex;
        const parts = getHighlightParts(cmd.name, query);
        return (
          <box 
            key={`${cmd.name}-${index}`}
            flexDirection='row'
            gap={1}
            width='100%'
          >
            <text fg={isSelected ? colors.status.success : colors.text.gray}>■</text>
            {parts ? (
              <box flexDirection='row' gap={0}>
                <text fg={colors.text.code}>/</text>
                {parts.prefix && <text fg={colors.text.code}>{parts.prefix}</text>}
                <text fg={colors.text.bold}>{parts.highlight}</text>
                {parts.suffix && <text fg={colors.text.code}>{parts.suffix}</text>}
              </box>
            ) : (
              <text fg={colors.text.code}>/{cmd.name}</text>
            )}
            <text fg={colors.text.gray}>{cmd.description || ''}</text>
          </box>
        );
      })}
    </box>
  );
}