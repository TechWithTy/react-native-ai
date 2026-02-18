const minimumMajor = 8
const minimumMinor = 15
const minimumPatch = 4
const maximumMajorExclusive = 10
const userAgent = process.env.npm_config_user_agent || ''

if (!userAgent.includes('pnpm/')) {
  console.error('[preinstall] This project must be installed with pnpm.')
  console.error('[preinstall] Use: pnpm install')
  process.exit(1)
}

const match = userAgent.match(/pnpm\/(\d+)\.(\d+)\.(\d+)/)
if (!match) {
  console.error('[preinstall] Could not detect pnpm version from npm_config_user_agent.')
  process.exit(1)
}

const major = Number(match[1])
const minor = Number(match[2])
const patch = Number(match[3])

const belowMinimum =
  major < minimumMajor ||
  (major === minimumMajor && minor < minimumMinor) ||
  (major === minimumMajor && minor === minimumMinor && patch < minimumPatch)
const aboveMaximum = major >= maximumMajorExclusive

if (belowMinimum || aboveMaximum) {
  console.error('[preinstall] Expected pnpm >=8.15.4 and <10.')
  console.error(`[preinstall] Detected pnpm ${major}.${minor}.${patch}.`)
  process.exit(1)
}
