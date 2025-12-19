/**
 * Patch do Next.js (dev --webpack):
 *
 * Em alguns cenários (especialmente Windows + fallback WASM do SWC),
 * o webpack empacota certos módulos CommonJS do Next (dist/client) como ESM e
 * o binding `exports` pode ficar desconectado de `__webpack_exports__`,
 * resultando em erros no browser como:
 * - "(0 , _cachemap.createCacheMap) is not a function"
 * - "(0 , _redirecterror.isRedirectError) is not a function"
 *
 * Esses módulos compartilham o padrão do SWC: `_export(exports, { ... })`.
 * Este script injeta um alias seguro logo após `"use strict";` para garantir que
 * `exports` aponte para `__webpack_exports__` quando disponível.
 *
 * Idempotente: roda várias vezes sem duplicar patch.
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const nextDistDir = path.join(projectRoot, 'node_modules', 'next', 'dist')
const nextDistClientDir = path.join(nextDistDir, 'client')
const nextDistSharedDir = path.join(nextDistDir, 'shared')
const nextDistLibDir = path.join(nextDistDir, 'lib')
const nextDistNextDevtoolsDir = path.join(nextDistDir, 'next-devtools')
const nextDevtoolsFile = path.join(
  projectRoot,
  'node_modules',
  'next',
  'dist',
  'compiled',
  'next-devtools',
  'index.js'
)

const MARKER = '/* __GOLFFOX_NEXT_WEBPACK_EXPORTS_PATCH__ */'
const CLIENT_INJECTION =
  `${MARKER}\n` +
  `var exports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports;\n`

// NOTE:
// `next/dist/compiled/next-devtools` é um bundle (rspack/webpack) que contém os
// próprios símbolos `__webpack_exports__`. Ao ser empacotado pelo webpack do
// Next (dev --webpack), esses símbolos são renomeados (ex.: `__nested_webpack_exports__`),
// o que faz o nosso `typeof __webpack_exports__` cair no fallback de `module.exports`.
// Porém, nesse contexto o webpack aplica `hmd(module)` e `module.exports` vira `undefined`.
// Resultado: `exports` fica `undefined` e explode em `exports.DevOverlayContext = ...`.
//
// Para o devtools, usamos `eval()` com `typeof` para acessar o `__webpack_exports__`
// do wrapper do webpack (não é renomeado por ser string), sem quebrar o require() no Node.
const DEVTOOLS_EXPORTS_LINE =
  `var exports = eval('typeof __webpack_exports__ !== \"undefined\" ? __webpack_exports__ : undefined') || module.exports;\n`
const DEVTOOLS_INJECTION = `${MARKER}\n${DEVTOOLS_EXPORTS_LINE}`

const CLIENT_EXPORTS_LINE =
  `var exports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports;\n`

const SWC_DEFAULT_INTEROP_IF =
  "if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {"
const SWC_DEFAULT_INTEROP_IF_PATCHED =
  "if (typeof __webpack_exports__ === 'undefined' && (typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {"

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
    } else if (entry.isFile()) {
      onFile(fullPath)
    }
  }
}

function patchFile(filePath) {
  if (!filePath.endsWith('.js')) return false

  let contents
  try {
    contents = fs.readFileSync(filePath, 'utf8')
  } catch {
    return false
  }

  let changed = false

  // 1) Garantir que `_export(exports, ...)` use o `exports` correto no webpack.
  if (contents.includes('_export(exports,') && !contents.includes(MARKER)) {
    const useStrict = '"use strict";'
    const idx = contents.indexOf(useStrict)
    if (idx !== -1) {
      const lineEndIdx = contents.indexOf('\n', idx + useStrict.length)
      if (lineEndIdx !== -1) {
        const insertAt = lineEndIdx + 1
        contents = contents.slice(0, insertAt) + CLIENT_INJECTION + contents.slice(insertAt)
        changed = true
      }
    }
  }

  // 2) Evitar que o SWC tente fazer interop via `module.exports = exports.default`
  // quando o webpack estiver tratando o módulo como ESM (isso dispara o hmd()).
  if (contents.includes(SWC_DEFAULT_INTEROP_IF) && !contents.includes(SWC_DEFAULT_INTEROP_IF_PATCHED)) {
    contents = contents.split(SWC_DEFAULT_INTEROP_IF).join(SWC_DEFAULT_INTEROP_IF_PATCHED)
    changed = true
  }

  if (!changed) return false

  fs.writeFileSync(filePath, contents, 'utf8')
  return true
}

function patchTopLevelExportsAlias(filePath) {
  if (!fs.existsSync(filePath)) return false

  let contents
  try {
    contents = fs.readFileSync(filePath, 'utf8')
  } catch {
    return false
  }

  if (contents.includes(MARKER)) {
    // Se já foi patchado, mas com a linha antiga, atualiza in-place.
    if (contents.includes(DEVTOOLS_EXPORTS_LINE)) return false
    if (contents.includes(CLIENT_EXPORTS_LINE)) {
      const nextContents = contents.replace(CLIENT_EXPORTS_LINE, DEVTOOLS_EXPORTS_LINE)
      if (nextContents !== contents) {
        fs.writeFileSync(filePath, nextContents, 'utf8')
        return true
      }
    }
    return false
  }

  // Some compiled bundles don't contain `"use strict";` near the top.
  // Inject at the file start.
  const nextContents = DEVTOOLS_INJECTION + contents
  fs.writeFileSync(filePath, nextContents, 'utf8')
  return true
}

function main() {
  if (!fs.existsSync(nextDistDir)) return

  let patched = 0
  if (patchTopLevelExportsAlias(nextDevtoolsFile)) patched++
  for (const dir of [
    nextDistClientDir,
    nextDistSharedDir,
    nextDistLibDir,
    nextDistNextDevtoolsDir,
  ]) {
    if (!fs.existsSync(dir)) continue
    walk(dir, (filePath) => {
      if (patchFile(filePath)) patched++
    })
  }

  if (patched > 0) {
    console.log(`✅ Next webpack exports patch aplicado em ${patched} arquivo(s).`)
  }
}

main()
