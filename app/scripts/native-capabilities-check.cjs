const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const nodeModulesRoot = path.join(projectRoot, 'node_modules')
const packageJsonPath = path.join(projectRoot, 'package.json')

const REQUIRED_NATIVE_PACKAGES = [
  'expo-notifications',
  'expo-location',
  'expo-document-picker',
  'expo-image-picker',
  'expo-audio',
  'expo-speech',
  'expo-clipboard',
  'expo-local-authentication',
  'expo-camera',
]

function packageExists(packageName) {
  try {
    require.resolve(packageName, { paths: [projectRoot] })
    return true
  } catch {
    return false
  }
}

function findTmpNativeDirs() {
  if (!fs.existsSync(nodeModulesRoot)) return []
  return fs
    .readdirSync(nodeModulesRoot)
    .filter(name => name.startsWith('expo-') && name.includes('_tmp_'))
}

function readPackageJson() {
  if (!fs.existsSync(packageJsonPath)) return null
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
}

function main() {
  const manifest = readPackageJson()
  if (!manifest) {
    console.error('[native:doctor] package.json not found.')
    process.exit(1)
  }

  const declaredDeps = manifest.dependencies || {}
  const missingFromManifest = REQUIRED_NATIVE_PACKAGES.filter(pkg => !declaredDeps[pkg])
  const missingFromNodeModules = REQUIRED_NATIVE_PACKAGES.filter(pkg => !packageExists(pkg))
  const tmpNativeDirs = findTmpNativeDirs()

  console.log('[native:doctor] Native capability dependency scan')
  console.log(`[native:doctor] Required packages: ${REQUIRED_NATIVE_PACKAGES.length}`)
  console.log(`[native:doctor] Missing from package.json: ${missingFromManifest.length}`)
  console.log(`[native:doctor] Missing from node_modules: ${missingFromNodeModules.length}`)
  console.log(`[native:doctor] Temporary expo dirs: ${tmpNativeDirs.length}`)

  if (missingFromManifest.length > 0) {
    console.log(`\n[native:doctor] Missing from package.json:\n- ${missingFromManifest.join('\n- ')}`)
  }

  if (missingFromNodeModules.length > 0) {
    console.log(`\n[native:doctor] Missing from node_modules:\n- ${missingFromNodeModules.join('\n- ')}`)
  }

  if (tmpNativeDirs.length > 0) {
    console.log(`\n[native:doctor] Temporary Expo directories detected:\n- ${tmpNativeDirs.join('\n- ')}`)
  }

  if (missingFromManifest.length > 0 || missingFromNodeModules.length > 0 || tmpNativeDirs.length > 0) {
    console.log('\n[native:doctor] Recommended repair command:')
    console.log('pnpm -C app run repair:deps')
    process.exit(1)
  }

  console.log('\n[native:doctor] All native capability dependencies look healthy.')
}

main()
