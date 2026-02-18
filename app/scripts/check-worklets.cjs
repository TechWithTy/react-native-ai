const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const bundlePath = path.join(projectRoot, 'dev-android.bundle.js')
const hermescPath = path.join(
  projectRoot,
  'node_modules',
  'react-native',
  'sdks',
  'hermesc',
  'win64-bin',
  'hermesc.exe'
)
const tempDir = path.join(projectRoot, '.tmp-worklet-check')

if (!fs.existsSync(bundlePath)) {
  console.error(`[check-worklets] Bundle not found: ${bundlePath}`)
  process.exit(1)
}

if (!fs.existsSync(hermescPath)) {
  console.error(`[check-worklets] Hermes compiler not found: ${hermescPath}`)
  process.exit(1)
}

const bundle = fs.readFileSync(bundlePath, 'utf8')
const sourceMapByToken = new Map()
const sourceMapRegex = /var\s+(_worklet_[\w$]+)\s*=\s*\{[\s\S]*?sourceMap:\s*"((?:\\.|[^"\\])*)"/g
let sourceMapMatch = null
while ((sourceMapMatch = sourceMapRegex.exec(bundle))) {
  sourceMapByToken.set(sourceMapMatch[1], sourceMapMatch[2])
}

const codeRegex = /var\s+(_worklet_[\w$]+)\s*=\s*\{[\s\S]*?code:\s*"((?:\\.|[^"\\])*)"/g
const errors = []
let total = 0
let match = null

fs.rmSync(tempDir, { recursive: true, force: true })
fs.mkdirSync(tempDir, { recursive: true })

function decode(value) {
  return JSON.parse(`"${value}"`)
}

function runHermesParse(inputPath, outputPath) {
  return spawnSync(hermescPath, ['-emit-binary', '-out', outputPath, inputPath], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
}

while ((match = codeRegex.exec(bundle))) {
  const token = match[1]
  const encodedCode = match[2]
  let code = ''
  try {
    code = decode(encodedCode)
  } catch (error) {
    errors.push({ token, reason: `Failed to decode code string: ${error.message}` })
    continue
  }

  total += 1
  const sourceFile = path.join(tempDir, `${token}.js`)
  const outputFile = path.join(tempDir, `${token}.hbc`)
  fs.writeFileSync(sourceFile, `(${code}\n)\n`, 'utf8')

  const result = runHermesParse(sourceFile, outputFile)
  if (result.status !== 0) {
    let sourceMap = ''
    try {
      const encodedMap = sourceMapByToken.get(token)
      if (encodedMap) sourceMap = decode(encodedMap)
    } catch {
      sourceMap = ''
    }
    errors.push({
      token,
      reason: 'Hermes parse failed for worklet code',
      stderr: result.stderr,
      sourceMap,
      codeSnippet: code.slice(0, 600),
    })
  }
}

if (errors.length > 0) {
  console.error(`[check-worklets] Parsed ${total} worklets, found ${errors.length} failure(s).`)
  for (const error of errors) {
    console.error('---')
    console.error(`[token] ${error.token}`)
    console.error(`[reason] ${error.reason}`)
    if (error.stderr) console.error(error.stderr.trim())
    if (error.codeSnippet) {
      console.error('[code snippet]')
      console.error(error.codeSnippet)
    }
    if (error.sourceMap) {
      console.error('[sourceMap snippet]')
      console.error(error.sourceMap.slice(0, 600))
    }
  }
  process.exit(1)
}

console.log(`[check-worklets] Parsed ${total} worklets. No Hermes parse errors found.`)
