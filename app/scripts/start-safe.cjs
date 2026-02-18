const { spawnSync } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const requiredModules = [
  '@babel/generator',
  '@babel/helper-globals/data/builtin-lower.json',
]

function run(command, args, envOverrides) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: envOverrides ? { ...process.env, ...envOverrides } : process.env,
  })
  return result.status ?? 1
}

function runQuiet(command, args, timeout = 5000) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    timeout,
  })
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

function printPnpmVersionHint() {
  const userAgent = process.env.npm_config_user_agent || ''
  const match = userAgent.match(/pnpm\/(\d+)\./)
  const major = match ? Number(match[1]) : NaN
  if (Number.isNaN(major) || major < 8 || major >= 10) {
    console.warn('[start-safe] Expected pnpm >=8.15.4 and <10. Run `pnpm --version` and switch if needed.')
  }
}

function ensureDependencies() {
  const missingBefore = findMissingModules()
  if (missingBefore.length === 0) return 0

  console.warn(`[start-safe] Missing modules detected: ${missingBefore.join(', ')}`)
  console.warn('[start-safe] Running `pnpm install --frozen-lockfile` before starting Metro...')
  const installExitCode = run('pnpm', ['install', '--frozen-lockfile'])
  if (installExitCode !== 0) return installExitCode

  const missingAfter = findMissingModules()
  if (missingAfter.length === 0) return 0

  console.error(`[start-safe] Still missing modules after install: ${missingAfter.join(', ')}`)
  console.error('[start-safe] Run `pnpm run repair:deps` and then start again.')
  return 1
}

function hasHostArg(args) {
  return args.some(arg => arg === '--localhost' || arg === '--lan' || arg === '--tunnel' || arg === '--host')
}

function ensureAdbReverse(port) {
  const devices = runQuiet('adb', ['devices'], 3000)
  if (devices.status !== 0) {
    console.warn('[start-safe] adb not available; skipping adb reverse setup.')
    return
  }

  const lines = devices.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('List of devices'))
    .filter(line => line.endsWith('\tdevice'))

  if (lines.length === 0) {
    console.warn('[start-safe] No connected Android devices/emulators detected for adb reverse.')
    return
  }

  const reverse = runQuiet('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], 3000)
  if (reverse.status === 0) {
    console.log(`[start-safe] adb reverse set: tcp:${port} -> tcp:${port}`)
  } else {
    console.warn('[start-safe] Failed to configure adb reverse; device may not reach localhost Metro.')
  }
}

function main() {
  printPnpmVersionHint()
  const dependencyStatus = ensureDependencies()
  if (dependencyStatus !== 0) {
    process.exit(dependencyStatus)
  }

  const extraArgs = process.argv.slice(2)
  const expoArgs = extraArgs.filter(arg => arg !== '--no-adb')
  const startEnv = {}
  if (!process.env.CI && process.env.ALLOW_HMR !== '1') {
    // Disables Metro reload/delta behavior that can intermittently emit malformed hot updates.
    startEnv.CI = '1'
    console.log('[start-safe] Running in stable mode (CI=1). Set ALLOW_HMR=1 to re-enable hot reload.')
  }
  const metroPort = process.env.RCT_METRO_PORT || '8081'
  const skipAdb = extraArgs.includes('--no-adb')
  if (!skipAdb) {
    ensureAdbReverse(metroPort)
  } else {
    console.log('[start-safe] Skipping adb reverse (found --no-adb)')
  }

  const hostArgs = hasHostArg(expoArgs) ? [] : ['--localhost']
  if (hostArgs.includes('--localhost')) {
    console.log('[start-safe] Defaulting to --localhost. If using a physical phone, run: pnpm start --lan')
  }
  const startExitCode = run(
    'pnpm',
    ['exec', 'expo', 'start', '--clear', ...hostArgs, ...expoArgs],
    startEnv
  )
  process.exit(startExitCode)
}

main()
