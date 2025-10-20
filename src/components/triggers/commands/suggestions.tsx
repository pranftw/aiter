import type { SlashCommand } from '@/triggers/commands/types';
import { colors } from '@/utils/colors';
import { useMemo, useState, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';

interface CommandSuggestionsProps {
  commands: SlashCommand[];
  query: string;
  onSelect: (command: SlashCommand) => void | Promise<void>;
}

export function CommandSuggestions({ commands, query, onSelect }: CommandSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means no selection

  // Score function to find best matching command
  const scoreCommand = (command: SlashCommand, query: string): number => {
    if (!query || query.length <= 1) return 0;
    
    const searchQuery = query.slice(1).toLowerCase(); // Remove '/' from query
    const commandName = command.name.toLowerCase();
    
    // Exact match gets highest score
    if (commandName === searchQuery) return 100;
    
    // Starts with query gets high score
    if (commandName.startsWith(searchQuery)) return 80;
    
    // Contains query gets medium score
    if (commandName.includes(searchQuery)) return 60;
    
    // Check aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        const aliasLower = alias.toLowerCase();
        if (aliasLower === searchQuery) return 90;
        if (aliasLower.startsWith(searchQuery)) return 70;
        if (aliasLower.includes(searchQuery)) return 50;
      }
    }
    
    // Description contains query gets low score
    if (command.description.toLowerCase().includes(searchQuery)) return 20;
    
    return 0;
  };

  // Client-side filtering based on query
  const filteredCommands = useMemo(() => {
    if (!query || query === '/') {
      return commands;
    }

    const searchQuery = query.slice(1).toLowerCase(); // Remove '/'
    return commands.filter((cmd) => {
      const name = cmd.name.toLowerCase();
      const desc = cmd.description?.toLowerCase() || '';
      return name.includes(searchQuery) || desc.includes(searchQuery);
    });
  }, [commands, query]);

  // Find best matching command and auto-select it
  useEffect(() => {
    if (filteredCommands.length === 0) {
      setSelectedIndex(-1);
      return;
    }

    // If showing all commands (just '/'), don't auto-select
    if (!query || query.length <= 1) {
      setSelectedIndex(-1);
      return;
    }

    // Find command with highest score
    let bestIndex = -1;
    let bestScore = 0;
    
    filteredCommands.forEach((command, index) => {
      const score = scoreCommand(command, query);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    // Only auto-select if we found a meaningful match
    if (bestScore > 0) {
      setSelectedIndex(bestIndex);
    } else {
      setSelectedIndex(-1);
    }
  }, [filteredCommands, query]);

  // Handle keyboard navigation
  useKeyboard((key) => {
    if (filteredCommands.length > 0) {
      if (key.name === 'up') {
        setSelectedIndex(prev => {
          if (prev === -1) return filteredCommands.length - 1; // From no selection to last
          if (prev === 0) return -1; // From first to no selection
          return prev - 1; // Normal up movement
        });
        return;
      }
      if (key.name === 'down') {
        setSelectedIndex(prev => {
          if (prev === -1) return 0; // From no selection to first
          if (prev === filteredCommands.length - 1) return -1; // From last to no selection
          return prev + 1; // Normal down movement
        });
        return;
      }
      if (key.name === 'return' && selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          onSelect(selectedCommand);
        }
        return;
      }
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

  if (filteredCommands.length === 0) {
    return (
      <box flexDirection='column' style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 2, paddingBottom: 2 }}>
        <text fg={colors.text.gray}>No commands found</text>
      </box>
    );
  }

  return (
    <box flexDirection='column' alignItems='flex-start' width='100%'>
      {filteredCommands.map((cmd, index) => {
        const isSelected = selectedIndex >= 0 && index === selectedIndex;
        const parts = getHighlightParts(cmd.name, query);
        return (
          <box 
            key={cmd.name}
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
            <text fg={colors.text.gray}>{cmd.description}</text>
          </box>
        );
      })}
    </box>
  );
}