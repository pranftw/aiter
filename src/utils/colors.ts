export const colors = {
  // Border colors
  border: {
    primary: 'rgb(4, 102, 194)',
    secondary: 'gray',
  },

  // Status indicator colors
  status: {
    started: 'rgb(230, 213, 122)', // yellow for start, input-available, input-streaming
    success: 'rgb(147, 199, 105)', // green for finish, output-available  
    error: 'rgb(201, 107, 107)',   // red for error/other states
  },

  // Text colors
  text: {
    // Standard text colors
    gray: 'gray',
    muted: '#DDDDDD',

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
} as const;

// Type for accessing color values with intellisense
export type Colors = typeof colors;
