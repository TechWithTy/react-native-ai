const fs = require('fs')
const path = require('path')

const root = process.cwd()
const targetRoot = path.join(root, 'src', 'screens', 'careerLift')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    if (entry.name.endsWith('.tsx')) files.push(fullPath)
  }
  return files
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('CLTheme')) return false
  if (filePath.endsWith(path.join('careerLift', 'theme.ts'))) return false

  let changed = false

  const importRegex = /import\s*\{\s*CLTheme\s*\}\s*from\s*['"](\.\/theme|\.\.\/theme)['"]/
  if (importRegex.test(content)) {
    content = content.replace(
      importRegex,
      "import { CLTheme, useCLStyles, type CLThemePalette } from '$1'"
    )
    changed = true
  }

  if (
    content.includes('StyleSheet.create(') &&
    content.includes('const styles = StyleSheet.create(') &&
    !content.includes('const createStyles = (CLTheme: CLThemePalette) => StyleSheet.create(')
  ) {
    content = content.replace(
      'const styles = StyleSheet.create(',
      'const createStyles = (CLTheme: CLThemePalette) => StyleSheet.create('
    )
    changed = true
  }

  if (
    content.includes('const createStyles = (CLTheme: CLThemePalette) => StyleSheet.create(') &&
    !content.includes('const styles = useCLStyles(createStyles)')
  ) {
    const exportIndex = content.indexOf('export function ')
    if (exportIndex !== -1) {
      const openBraceIndex = content.indexOf('{', exportIndex)
      if (openBraceIndex !== -1) {
        const injection = '\n  const styles = useCLStyles(createStyles)\n'
        content = `${content.slice(0, openBraceIndex + 1)}${injection}${content.slice(openBraceIndex + 1)}`
        changed = true
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
  }

  return changed
}

const files = walk(targetRoot)
const changedFiles = []
for (const filePath of files) {
  if (patchFile(filePath)) changedFiles.push(path.relative(root, filePath))
}

console.log(`Patched ${changedFiles.length} files`)
for (const file of changedFiles) {
  console.log(`- ${file}`)
}
