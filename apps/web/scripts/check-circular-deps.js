#!/usr/bin/env node

/**
 * Script para verificar dependências circulares no projeto
 * 
 * Uso: node scripts/check-circular-deps.js
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const libPath = path.join(projectRoot, 'lib')
const componentsPath = path.join(projectRoot, 'components')

/**
 * Extrai imports de um arquivo
 */
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const imports = []
  
  // Regex para capturar imports
  const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g
  let match
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    
    // Resolver caminho relativo
    if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
      imports.push(importPath)
    }
  }
  
  return imports
}

/**
 * Resolve caminho de import para caminho absoluto
 */
function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    return path.join(projectRoot, importPath.replace('@/', ''))
  }
  
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const dir = path.dirname(fromFile)
    const resolved = path.resolve(dir, importPath)
    
    // Tentar com extensões comuns
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
    for (const ext of extensions) {
      const fullPath = resolved + ext
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }
    
    // Se não encontrou, retornar o caminho sem extensão
    return resolved
  }
  
  return null
}

/**
 * Encontra todos os arquivos TypeScript/JavaScript
 */
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Ignorar node_modules, .next, etc
      if (!['node_modules', '.next', 'dist', 'coverage'].includes(file)) {
        findTSFiles(filePath, fileList)
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file) && !file.endsWith('.d.ts')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

/**
 * Verifica dependências circulares
 */
function checkCircularDeps() {
  console.log('🔍 Verificando dependências circulares...\n')
  
  const files = [
    ...findTSFiles(libPath),
    ...findTSFiles(componentsPath)
  ]
  
  const graph = new Map()
  
  // Construir grafo de dependências
  files.forEach(file => {
    const imports = extractImports(file)
    const resolvedImports = imports
      .map(imp => resolveImportPath(imp, file))
      .filter(Boolean)
      .filter(imp => files.includes(imp))
    
    graph.set(file, resolvedImports)
  })
  
  // Verificar ciclos usando DFS
  const visited = new Set()
  const recStack = new Set()
  const cycles = []
  
  function dfs(node, path = []) {
    if (recStack.has(node)) {
      // Ciclo encontrado!
      const cycleStart = path.indexOf(node)
      const cycle = path.slice(cycleStart).concat(node)
      cycles.push(cycle)
      return
    }
    
    if (visited.has(node)) {
      return
    }
    
    visited.add(node)
    recStack.add(node)
    
    const neighbors = graph.get(node) || []
    neighbors.forEach(neighbor => {
      dfs(neighbor, [...path, node])
    })
    
    recStack.delete(node)
  }
  
  files.forEach(file => {
    if (!visited.has(file)) {
      dfs(file)
    }
  })
  
  // Reportar resultados
  if (cycles.length === 0) {
    console.log('✅ Nenhuma dependência circular encontrada!\n')
    return 0
  }
  
  console.log(`❌ Encontradas ${cycles.length} dependência(s) circular(es):\n`)
  
  cycles.forEach((cycle, index) => {
    console.log(`Ciclo ${index + 1}:`)
    cycle.forEach((file, i) => {
      const relativePath = path.relative(projectRoot, file)
      const arrow = i < cycle.length - 1 ? ' → ' : ' → (volta ao início)'
      console.log(`  ${relativePath}${arrow}`)
    })
    console.log()
  })
  
  return cycles.length
}

// Executar
const exitCode = checkCircularDeps()
process.exit(exitCode)

