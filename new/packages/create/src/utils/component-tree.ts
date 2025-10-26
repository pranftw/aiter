import path from 'path';
import type { ComponentMap, ComponentInfo } from './component-operations';

export interface TreeNode {
  type: 'directory' | 'component';
  name: string;
  path: string;
  fullPath: string;
  component?: ComponentInfo;
  children: TreeNode[];
  parent?: TreeNode;
  depth: number;
}

export interface FlattenedNode {
  node: TreeNode;
  isLast: boolean;
  prefix: string;
}

/**
 * Build a hierarchical tree from flat component map
 */
export function buildComponentTree(components: ComponentMap): TreeNode {
  const root: TreeNode = {
    type: 'directory',
    name: 'components',
    path: '',
    fullPath: '',
    children: [],
    depth: 0,
  };
  
  // Sort keys for consistent ordering
  const sortedKeys = Object.keys(components).sort();
  
  for (const key of sortedKeys) {
    const component = components[key];
    if (component) {
      insertIntoTree(root, component, key);
    }
  }
  
  return root;
}

/**
 * Insert a component into the tree at the correct location
 */
function insertIntoTree(root: TreeNode, component: ComponentInfo, key: string): void {
  const parts = key.split('/');
  let current = root;
  
  // Navigate/create directory structure
  for (let i = 0; i < parts.length - 1; i++) {
    const dirName = parts[i];
    if (!dirName) continue;
    
    const dirPath = parts.slice(0, i + 1).join('/');
    
    let child = current.children.find(
      (c) => c.type === 'directory' && c.name === dirName
    );
    
    if (!child) {
      child = {
        type: 'directory',
        name: dirName,
        path: dirPath,
        fullPath: dirPath,
        children: [],
        parent: current,
        depth: current.depth + 1,
      };
      current.children.push(child);
    }
    
    current = child;
  }
  
  // Add the component
  const componentName = parts[parts.length - 1];
  if (!componentName) return;
  
  const componentNode: TreeNode = {
    type: 'component',
    name: componentName,
    path: key,
    fullPath: key,
    component,
    children: [],
    parent: current,
    depth: current.depth + 1,
  };
  
  current.children.push(componentNode);
}

/**
 * Flatten tree to a list with metadata for rendering
 */
export function flattenTree(
  node: TreeNode,
  customized: Set<string>,
  prefix: string = '',
  isLast: boolean = true
): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  
  // Don't include root in output
  if (node.depth > 0) {
    result.push({
      node,
      isLast,
      prefix,
    });
  }
  
  // Process children
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    
    const isLastChild = i === children.length - 1;
    
    const childPrefix =
      node.depth === 0
        ? ''
        : prefix + (isLast ? '    ' : '│   ');
    
    result.push(...flattenTree(child, customized, childPrefix, isLastChild));
  }
  
  return result;
}

/**
 * Get all components in a directory (including subdirectories)
 */
export function getAllComponentsInDirectory(node: TreeNode): string[] {
  const components: string[] = [];
  
  if (node.type === 'component') {
    components.push(node.path);
  } else {
    for (const child of node.children) {
      components.push(...getAllComponentsInDirectory(child));
    }
  }
  
  return components;
}

/**
 * Get parent directories for a component path
 */
export function getParentDirectories(componentPath: string): string[] {
  const parts = componentPath.split('/');
  const parents: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('/'));
  }
  
  return parents;
}

/**
 * Find a node by path in the tree
 */
export function findNodeByPath(root: TreeNode, targetPath: string): TreeNode | null {
  if (root.path === targetPath) {
    return root;
  }
  
  for (const child of root.children) {
    if (child) {
      const found = findNodeByPath(child, targetPath);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

