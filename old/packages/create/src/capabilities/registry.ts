export const CAPABILITIES = {
  'commands': 'commands',
  'tools': 'tools',
  'mcps': 'mcps',
  'system-prompts': 'system-prompts',
  'components': 'components',
} as const;

export type Capability = keyof typeof CAPABILITIES;

export const CORE_FILES = ['schema.ts', 'stream-function.ts'];

export function validateCapabilities(names: string[]): { valid: Capability[]; invalid: string[] } {
  const valid: Capability[] = [];
  const invalid: string[] = [];

  for (const name of names) {
    if (name in CAPABILITIES) {
      valid.push(name as Capability);
    } else {
      invalid.push(name);
    }
  }

  return { valid, invalid };
}

export function getAllCapabilities(): Capability[] {
  return Object.keys(CAPABILITIES) as Capability[];
}

export function resolveCapabilities(input: string[]): Capability[] {
  if (input.includes('all')) {
    return getAllCapabilities();
  }
  return input as Capability[];
}

