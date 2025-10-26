#!/usr/bin/env bun
import { $ } from 'bun'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

const argv = yargs(hideBin(process.argv))
  .option('pkg', {
    alias: 'p',
    type: 'string',
    description: 'Package name to build',
    choices: ['aiter', 'create'],
    demandOption: true,
  })
  .option('prod', {
    type: 'boolean',
    description: 'Publish to npm after building',
    default: false,
  })
  .option('bump', {
    type: 'string',
    description: 'Version bump type',
    choices: ['patch', 'minor', 'major'],
    default: 'patch',
  })
  .help()
  .parseSync()

// Find workspace root by looking for package.json with workspaces field
const findWorkspaceRoot = (startDir: string): string => {
  const packageJsonPath = join(startDir, 'package.json')
  if (existsSync(packageJsonPath)) {
    const pkg = require(packageJsonPath)
    if (pkg.workspaces) {
      return startDir
    }
  }
  const parentDir = resolve(startDir, '..')
  if (parentDir === startDir) {
    throw new Error('Could not find workspace root')
  }
  return findWorkspaceRoot(parentDir)
}

const workspaceRoot = findWorkspaceRoot(process.cwd())
const pkgDir = join(workspaceRoot, 'packages', argv.pkg)
process.chdir(pkgDir)

const pkgJson = await Bun.file('package.json').json()

console.log(`Building ${pkgJson.name}...`)

// Clean
await $`rm -rf dist`

// Build JS with Bun
// Mark dependencies as external (don't bundle them) - they will be resolved by the consuming app
const externalDeps = [
  ...Object.keys(pkgJson.dependencies || {}),
  ...Object.keys(pkgJson.peerDependencies || {}),
]

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'external',
  splitting: pkgJson.bin ? false : true,
  external: externalDeps,
})

if (!result.success) {
  console.error('Build failed')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Build TypeScript declarations
await $`tsc --emitDeclarationOnly`

// Copy additional files/directories that need to be published
if (argv.pkg === 'create') {
  console.log('Copying template directory...')
  await $`cp -r template dist/template`
}

// Create package.json for dist
const { scripts, devDependencies, publishConfig, main, types, files, ...publishPkg } = pkgJson

const distPkg = {
  ...publishPkg,
  exports: pkgJson.bin ? undefined : { '.': './index.js' },
  main: pkgJson.bin ? undefined : './index.js',
  types: pkgJson.bin ? undefined : './index.d.ts',
  bin: pkgJson.bin ? Object.fromEntries(
    Object.entries(pkgJson.bin).map(([key, value]) => [
      key,
      (value as string).replace(/^\.\/dist\//, './')
    ])
  ) : undefined,
}

await Bun.write('dist/package.json', JSON.stringify(distPkg, null, 2))

console.log(`✓ ${pkgJson.name} build complete`)

// Handle production publishing
if (argv.prod) {
  console.log(`\nBumping version (${argv.bump})...`)
  
  // Read current version
  const [major, minor, patch] = pkgJson.version.split('.').map(Number)
  
  // Calculate new version
  const newVersion = argv.bump === 'major' 
    ? `${major + 1}.0.0`
    : argv.bump === 'minor'
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`
  
  console.log(`Version: ${pkgJson.version} → ${newVersion}`)
  
  // Update version in source package.json
  pkgJson.version = newVersion
  await Bun.write('package.json', JSON.stringify(pkgJson, null, 2))
  
  // Update version in dist package.json
  distPkg.version = newVersion
  await Bun.write('dist/package.json', JSON.stringify(distPkg, null, 2))
  
  console.log(`\nPublishing ${pkgJson.name}@${newVersion} to npm...`)
  
  // Publish from dist directory
  await $`cd dist && bun publish --access public`
  
  console.log(`✓ ${pkgJson.name}@${newVersion} published successfully`)
}

