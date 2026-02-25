const { spawnSync } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const extraArgs = process.argv
  .slice(2)
  .flatMap(arg => (arg === '--clear' ? ['--no-build-cache'] : [arg]))

const env = {
  ...process.env,
  ORG_GRADLE_PROJECT_reactNativeArchitectures: 'x86_64',
  EXPO_USE_COMMUNITY_AUTOLINKING: '1',
}

const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'run:android', ...extraArgs],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  }
)

process.exit(result.status ?? 1)
