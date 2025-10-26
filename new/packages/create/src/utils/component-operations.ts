import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from '@typescript-eslint/typescript-estree';

export interface ComponentInfo {
  name: string;
  path: string;
  absolutePath: string;
  propsType?: string;
  dependencies: string[];
  hash: string;
}

export interface ComponentMap {
  [key: string]: ComponentInfo;
}

/**
 * Get the path to the aiter package
 */
export function getPackagePath(): string {
  const packageName = '@pranftw/aiter';
  let current = process.cwd();
  
  // First, check if we're in a monorepo (development environment)
  while (current !== path.parse(current).root) {
    // Check for monorepo structure: packages/aiter
    const monorepoPath = path.join(current, 'packages', 'aiter');
    if (fs.existsSync(monorepoPath) && fs.existsSync(path.join(monorepoPath, 'package.json'))) {
      return monorepoPath;
    }
    
    // Check for installed package in node_modules
    const possiblePath = path.join(current, 'node_modules', packageName);
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
    
    current = path.dirname(current);
  }
  
  throw new Error(`Could not find ${packageName} package`);
}

/**
 * Scan directory recursively for component files
 */
function scanDirectory(dir: string, basePath: string): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return components;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      components.push(...scanDirectory(fullPath, basePath));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && entry.name !== 'index.ts') {
      const relativePath = path.relative(basePath, fullPath);
      const componentInfo = analyzeComponentFile(fullPath, relativePath);
      if (componentInfo) {
        components.push(componentInfo);
      }
    }
  }
  
  return components;
}

/**
 * Analyze a component file to extract metadata
 */
function analyzeComponentFile(filePath: string, relativePath: string): ComponentInfo | null {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Generate hash for the file
  const hash = crypto.createHash('md5').update(content).digest('hex');
  
  let propsType: string | undefined;
  const dependencies: string[] = [];
  
  try {
    const ast = parse(content, {
      jsx: true,
      loc: true,
      range: true,
    });
    
    // Extract dependencies (imports)
    dependencies.push(...extractDependencies(ast, content));
    
    // Try to find props type/interface
    // Look for exported interface ending with Props
    for (const node of ast.body) {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'TSInterfaceDeclaration'
      ) {
        const interfaceName = node.declaration.id.name;
        if (interfaceName.endsWith('Props')) {
          propsType = interfaceName;
          break;
        }
      }
    }
  } catch (error) {
    // If parsing fails, continue without metadata
    console.warn(`Failed to parse ${filePath}:`, error);
  }
  
  const name = path.basename(filePath, path.extname(filePath));
  
  return {
    name,
    path: relativePath,
    absolutePath: filePath,
    propsType,
    dependencies,
    hash,
  };
}

/**
 * Extract import statements from AST
 */
function extractDependencies(ast: any, content: string): string[] {
  const deps: string[] = [];
  
  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value;
      
      // Only include relative imports (internal dependencies)
      if (source.startsWith('.') || source.startsWith('@/')) {
        deps.push(source);
      }
    }
  }
  
  return deps;
}

/**
 * Generate a component key from its path
 * e.g., "chat/container.tsx" -> "chat/container"
 */
export function generateComponentKey(componentPath: string): string {
  return componentPath.replace(/\.(tsx|ts)$/, '');
}

/**
 * Get all components from the package
 */
export function getPackageComponents(): ComponentMap {
  const packagePath = getPackagePath();
  const componentsDir = path.join(packagePath, 'src', 'components');
  
  const components = scanDirectory(componentsDir, componentsDir);
  
  const componentMap: ComponentMap = {};
  for (const component of components) {
    const key = generateComponentKey(component.path);
    componentMap[key] = component;
  }
  
  return componentMap;
}

/**
 * Get customized components from the project
 */
export function getCustomizedComponents(projectRoot: string): Set<string> {
  const customizedDir = path.join(projectRoot, 'src', 'components');
  const customized = new Set<string>();
  
  if (!fs.existsSync(customizedDir)) {
    return customized;
  }
  
  const components = scanDirectory(customizedDir, customizedDir);
  
  for (const component of components) {
    const key = generateComponentKey(component.path);
    customized.add(key);
  }
  
  return customized;
}

/**
 * Transform all imports to package imports (@pranftw/aiter)
 * Only merges imports from @pranftw/aiter, leaves all others unchanged
 */
function transformImports(content: string, componentPath: string): string {
  const lines = content.split('\n');
  const aiterNamedImports: string[] = [];
  let aiterDefaultImport: string | null = null;
  const transformedLines: string[] = [];
  let firstImportIndex = -1;
  
  lines.forEach((line, index) => {
    // Match any import statement
    const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
    
    if (!importMatch) {
      transformedLines.push(line);
      return;
    }
    
    const [, importClause, importPath] = importMatch;
    
    if (!importPath || !importClause) {
      transformedLines.push(line);
      return;
    }
    
    // Track the first import line position
    if (firstImportIndex === -1) {
      firstImportIndex = transformedLines.length;
    }
    
    // Check if this is a package-internal import
    const isInternalImport = importPath.startsWith('@/') || 
                             importPath.startsWith('./') || 
                             importPath.startsWith('../');
    
    if (isInternalImport) {
      // Collect @pranftw/aiter imports
      const trimmed = importClause.trim();
      
      // Check for default import (e.g., "Something" or "Something, { ... }")
      if (!trimmed.startsWith('{')) {
        // Has a default import
        const defaultMatch = trimmed.match(/^([^,{]+)/);
        if (defaultMatch && defaultMatch[1] && !aiterDefaultImport) {
          aiterDefaultImport = defaultMatch[1].trim();
        }
        
        // Check if there are also named imports after the default
        const namedMatch = trimmed.match(/,\s*\{(.+)\}/);
        if (namedMatch && namedMatch[1]) {
          aiterNamedImports.push(namedMatch[1].trim());
        }
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        // Only named imports
        aiterNamedImports.push(trimmed.slice(1, -1).trim());
      }
    } else {
      // Keep external imports as-is
      transformedLines.push(line);
    }
  });
  
  // Insert merged @pranftw/aiter import at the end of imports section
  if ((aiterNamedImports.length > 0 || aiterDefaultImport) && firstImportIndex !== -1) {
    const mergedImport: string[] = [];
    
    if (aiterDefaultImport && aiterNamedImports.length > 0) {
      // Both default and named imports
      mergedImport.push(`import ${aiterDefaultImport}, {`);
      aiterNamedImports.forEach((clause, idx) => {
        const isLast = idx === aiterNamedImports.length - 1;
        mergedImport.push(`  ${clause}${isLast ? '' : ','}`);
      });
      mergedImport.push(`} from '@pranftw/aiter'`);
    } else if (aiterDefaultImport) {
      // Only default import
      mergedImport.push(`import ${aiterDefaultImport} from '@pranftw/aiter'`);
    } else {
      // Only named imports
      mergedImport.push(`import {`);
      aiterNamedImports.forEach((clause, idx) => {
        const isLast = idx === aiterNamedImports.length - 1;
        mergedImport.push(`  ${clause}${isLast ? '' : ','}`);
      });
      mergedImport.push(`} from '@pranftw/aiter'`);
    }
    
    // Find where to insert (after last import)
    let insertIndex = transformedLines.length;
    for (let i = transformedLines.length - 1; i >= 0; i--) {
      const line = transformedLines[i];
      if (line && line.match(/^import\s+/)) {
        insertIndex = i + 1;
        break;
      }
    }
    
    transformedLines.splice(insertIndex, 0, ...mergedImport);
  }
  
  return transformedLines.join('\n');
}

/**
 * Copy a component from package to project
 */
export function copyComponentToProject(
  componentKey: string,
  packageComponents: ComponentMap,
  projectRoot: string
): void {
  const component = packageComponents[componentKey];
  if (!component) {
    throw new Error(`Component ${componentKey} not found in package`);
  }
  
  const destPath = path.join(projectRoot, 'src', 'components', component.path);
  const destDir = path.dirname(destPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Read the file content
  const content = fs.readFileSync(component.absolutePath, 'utf8');
  
  // Transform imports
  const transformedContent = transformImports(content, component.path);
  
  // Write the transformed file
  fs.writeFileSync(destPath, transformedContent, 'utf8');
}

/**
 * Remove a customized component from the project
 */
export function removeCustomizedComponent(
  componentKey: string,
  projectRoot: string
): void {
  const componentPath = componentKey + '.tsx';
  const tsPath = componentKey + '.ts';
  
  const destPathTsx = path.join(projectRoot, 'src', 'components', componentPath);
  const destPathTs = path.join(projectRoot, 'src', 'components', tsPath);
  
  if (fs.existsSync(destPathTsx)) {
    fs.unlinkSync(destPathTsx);
  } else if (fs.existsSync(destPathTs)) {
    fs.unlinkSync(destPathTs);
  }
  
  // Clean up empty directories
  cleanupEmptyDirs(path.dirname(destPathTsx), path.join(projectRoot, 'src', 'components'));
}

/**
 * Clean up empty directories recursively
 */
export function cleanupEmptyDirs(dir: string, stopAt: string): void {
  if (dir === stopAt || !fs.existsSync(dir)) {
    return;
  }
  
  const entries = fs.readdirSync(dir);
  if (entries.length === 0) {
    fs.rmdirSync(dir);
    cleanupEmptyDirs(path.dirname(dir), stopAt);
  }
}

/**
 * Generate the components/index.ts file that exports all customized components
 */
export function generateComponentExports(
  customizedComponents: Set<string>,
  packageComponents: ComponentMap,
  projectRoot: string
): void {
  const indexPath = path.join(projectRoot, 'src', 'components', 'index.ts');
  
  const lines: string[] = [];
  
  // Sort components for consistent output
  const sortedKeys = Array.from(customizedComponents).sort();
  
  for (const key of sortedKeys) {
    const component = packageComponents[key];
    if (!component) continue;
    
    const importPath = './' + key;
    
    // Generate export statement
    // For default exports, import and re-export
    // For named exports, use export * from
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', component.path),
      'utf8'
    );
    
    if (content.includes('export default')) {
      // Default export
      lines.push(`export { default as ${component.name} } from '${importPath}';`);
    } else {
      // Named export
      lines.push(`export * from '${importPath}';`);
    }
  }
  
  if (lines.length === 0) {
    // No customized components, create empty file with comment
    fs.writeFileSync(
      indexPath,
      '// This file is auto-generated. Customize components using: bunx @pranftw/create component\n'
    );
  } else {
    fs.writeFileSync(indexPath, lines.join('\n') + '\n');
  }
}

