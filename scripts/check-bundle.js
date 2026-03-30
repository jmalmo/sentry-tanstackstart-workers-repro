/**
 * Post-build analysis: scan the Nitro server output for @sentry/node artifacts.
 *
 * This script checks whether the 'workerd' export condition caused
 * @sentry/tanstackstart-react to pull @sentry/node into the Worker bundle.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const NITRO_OUTPUT = '.output/server'

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walk(full))
    } else if (full.endsWith('.js') || full.endsWith('.mjs')) {
      files.push(full)
    }
  }
  return files
}

// Patterns that indicate @sentry/node leaked into the bundle
const NODE_PATTERNS = [
  /from ['"]@sentry\/node['"]/,
  /require\(['"]@sentry\/node['"]\)/,
  /['"]node:http['"]/,
  /['"]node:os['"]/,
  /['"]node:fs['"]/,
  /['"]node:diagnostics_channel['"]/,
  /['"]node:zlib['"]/,
  /undici/,
  /@opentelemetry\/instrumentation/,
]

console.log('\n=== Bundle Analysis ===\n')

let foundIssues = false
const files = walk(NITRO_OUTPUT)
let totalSize = 0

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const size = statSync(file).size
  totalSize += size
  const matches = []

  for (const pattern of NODE_PATTERNS) {
    if (pattern.test(content)) {
      matches.push(pattern.source)
    }
  }

  if (matches.length > 0) {
    foundIssues = true
    console.log(`PROBLEM: ${file} (${(size / 1024).toFixed(0)} KiB)`)
    for (const m of matches) {
      console.log(`  - contains: ${m}`)
    }
  }
}

console.log(`\nTotal server output: ${(totalSize / 1024).toFixed(0)} KiB across ${files.length} files`)

if (foundIssues) {
  console.log('\n❌ @sentry/node artifacts found in Worker bundle.')
  console.log('   The workerd/worker export conditions resolved to the Node server entry.')
  console.log('   This will cause "Cannot initialize ExportedHandler" on Cloudflare Workers.\n')
  process.exit(1)
} else {
  console.log('\n✅ No @sentry/node artifacts found — bundle is Workers-safe.\n')
}
