/**
 * Generic registry for managing collections of trigger items
 * Can be extended for specific trigger types (commands, files, etc.)
 */
export class TriggerRegistry<T extends { name: string; aliases?: string[] }> {
  protected items = new Map<string, T>();

  /**
   * Register an item with the registry
   * Also registers all aliases to point to the same item
   */
  register(item: T): void {
    this.items.set(item.name, item);

    // Register aliases
    if (item.aliases) {
      for (const alias of item.aliases) {
        this.items.set(alias, item);
      }
    }
  }

  /**
   * Get an item by name or alias
   */
  get(name: string): T | undefined {
    return this.items.get(name);
  }

  /**
   * Search for items matching a query
   * Performs case-insensitive substring matching on name and aliases
   */
  search(query: string): T[] {
    if (!query) {
      return this.getAll();
    }

    const lowerQuery = query.toLowerCase();
    const matches = new Set<T>();

    for (const item of this.items.values()) {
      // Check if name matches
      if (item.name.toLowerCase().includes(lowerQuery)) {
        matches.add(item);
        continue;
      }

      // Check if any alias matches
      if (item.aliases) {
        for (const alias of item.aliases) {
          if (alias.toLowerCase().includes(lowerQuery)) {
            matches.add(item);
            break;
          }
        }
      }
    }

    return Array.from(matches);
  }

  /**
   * Get all unique items (excluding aliases)
   */
  getAll(): T[] {
    const unique = new Set<T>();
    for (const item of this.items.values()) {
      unique.add(item);
    }
    return Array.from(unique);
  }

  /**
   * Check if an item exists by name
   */
  has(name: string): boolean {
    return this.items.has(name);
  }

  /**
   * Get the count of unique items
   */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Clear all items from the registry
   */
  clear(): void {
    this.items.clear();
  }
}

