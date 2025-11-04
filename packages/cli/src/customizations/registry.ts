export const CUSTOMIZATIONS = {
  'commands': 'commands',
  'tools': 'tools',
  'mcps': 'mcps',
  'system-prompts': 'system-prompts',
} as const;

export type Customization = keyof typeof CUSTOMIZATIONS;

export const CORE_FILES = ['schema.ts', 'stream-function.ts'];

export function validateCustomizations(names: string[]): { valid: Customization[]; invalid: string[] } {
  const valid: Customization[] = [];
  const invalid: string[] = [];

  for (const name of names) {
    if (name in CUSTOMIZATIONS) {
      valid.push(name as Customization);
    } else {
      invalid.push(name);
    }
  }

  return { valid, invalid };
}

export function getAllCustomizations(): Customization[] {
  return Object.keys(CUSTOMIZATIONS) as Customization[];
}

export function resolveCustomizations(input: string[]): Customization[] {
  if (input.includes('all')) {
    return getAllCustomizations();
  }
  return input as Customization[];
}

