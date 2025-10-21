import { error } from "console";

export const colors = {
  // Border colors
  border: {
    primary: '#0466c2',
    secondary: '#b0b0b0',
  },

  // Background colors
  background: {
    primary: '#363636',
    secondary: '#262626',
  },

  // Status indicator colors
  status: {
    started: '#e6d57a', // yellow for start, input-available, input-streaming
    success: '#93c769', // green for finish, output-available  
    error: '#c96b6b',   // red for error/other states
  },

  // Text colors
  text: {
    // Standard text colors
    gray: '#555555',
    muted: '#262626',

    // Markdown styling colors
    bold: '#C6D870',      // light green for bold text
    italic: '#A7C1A8',    // green for italic text
    code: '#578FCA',      // blue for inline code
    link: '#F79B72',      // orange for link text
    url: '#A1E3F9',       // light blue for URLs

    // Header colors
    header: {
      primary: '#F79B72',   // orange for h1, h2
      secondary: '#C6D870', // light green for h3
      tertiary: '#A7C1A8',  // green for h4+
    },
  },

  error: {
    primary: '#DE0000',
    secondary: '#5D0000'
  }
} as const;

// Type for accessing color values with intellisense
export type Colors = typeof colors;
