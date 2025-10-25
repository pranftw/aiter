import fs from 'fs-extra';
import path from 'path';

export interface ProjectContext {
  isAiterProject: boolean;
  agents: string[];
  projectPath: string;
}

export async function detectAiterProject(projectPath: string): Promise<boolean> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const agentsPath = path.join(projectPath, 'src/ai/agents');

  // Check if package.json exists
  if (!(await fs.pathExists(packageJsonPath))) {
    return false;
  }

  // Check if src/ai/agents/ exists
  if (!(await fs.pathExists(agentsPath))) {
    return false;
  }

  // Check if package.json has @pranftw/aiter dependency
  try {
    const packageJson = await fs.readJson(packageJsonPath);
    return !!packageJson.dependencies?.['@pranftw/aiter'];
  } catch {
    return false;
  }
}

export async function getExistingAgents(projectPath: string): Promise<string[]> {
  const agentsPath = path.join(projectPath, 'src/ai/agents');

  if (!(await fs.pathExists(agentsPath))) {
    return [];
  }

  const entries = await fs.readdir(agentsPath, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

export async function detectContext(projectPath: string): Promise<ProjectContext> {
  const isAiterProject = await detectAiterProject(projectPath);
  const agents = isAiterProject ? await getExistingAgents(projectPath) : [];

  return {
    isAiterProject,
    agents,
    projectPath,
  };
}

