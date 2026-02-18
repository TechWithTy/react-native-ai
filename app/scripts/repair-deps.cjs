const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const pathsToDelete = [
  'node_modules',
  '.expo',
  '.expo-shared',
]
const requiredModules = [
  '@babel/generator',
  '@babel/helper-globals/data/builtin-lower.json',
]

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status ?? 1
}

function removePath(relativePath) {
  const target = path.join(projectRoot, relativePath)
  if (!fs.existsSync(target)) return
  fs.rmSync(target, { recursive: true, force: true })
  console.log(`[repair:deps] Removed ${relativePath}`)
}

function findMissingModules() {
  return requiredModules.filter(moduleName => {
    try {
      require.resolve(moduleName, { paths: [projectRoot] })
      return false
    } catch {
      return true
    }
  })
}

function main() {
  console.log('[repair:deps] Starting dependency repair...')
  for (const target of pathsToDelete) {
    removePath(target)
  }

  const installExitCode = run('pnpm', ['install', '--frozen-lockfile'])
  if (installExitCode !== 0) process.exit(installExitCode)

  const missing = findMissingModules()
  if (missing.length > 0) {
    console.error(`[repair:deps] Missing modules after reinstall: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log('[repair:deps] Dependency tree repaired successfully.')
}

main()
