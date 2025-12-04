#!/usr/bin/env node

/**
 * Script para validar cobertura de testes
 * Falha se cobertura não atingir 100%
 */

const fs = require('fs')
const path = require('path')

const COVERAGE_DIR = path.join(__dirname, '../coverage')
const COVERAGE_SUMMARY = path.join(COVERAGE_DIR, 'coverage-summary.json')

const THRESHOLD = {
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
}

function readCoverageSummary() {
  if (!fs.existsSync(COVERAGE_SUMMARY)) {
    console.error('❌ Arquivo de cobertura não encontrado. Execute: npm run test:coverage')
    process.exit(1)
  }

  const content = fs.readFileSync(COVERAGE_SUMMARY, 'utf-8')
  return JSON.parse(content)
}

function checkCoverage() {
  const summary = readCoverageSummary()
  const totals = summary.total

  let hasErrors = false
  const errors = []

  // Verificar cada métrica
  for (const [metric, threshold] of Object.entries(THRESHOLD)) {
    const actual = totals[metric]?.pct || 0
    
    if (actual < threshold) {
      hasErrors = true
      errors.push({
        metric,
        actual: actual.toFixed(2),
        threshold,
      })
    }
  }

  // Exibir resultados
  console.log('\n📊 Cobertura de Testes\n')
  console.log('Métrica          | Atual    | Meta     | Status')
  console.log('-----------------|----------|----------|--------')

  for (const [metric, threshold] of Object.entries(THRESHOLD)) {
    const actual = totals[metric]?.pct || 0
    const status = actual >= threshold ? '✅' : '❌'
    console.log(
      `${metric.padEnd(17)} | ${actual.toFixed(2).padStart(8)}% | ${threshold.toString().padStart(8)}% | ${status}`
    )
  }

  if (hasErrors) {
    console.log('\n❌ Cobertura abaixo do esperado!\n')
    console.log('Métricas que precisam de atenção:')
    errors.forEach(({ metric, actual, threshold }) => {
      console.log(`  - ${metric}: ${actual}% (meta: ${threshold}%)`)
    })
    console.log('\n💡 Dica: Execute `npm run test:coverage` para ver relatório detalhado')
    process.exit(1)
  } else {
    console.log('\n✅ Cobertura de 100% atingida!\n')
    process.exit(0)
  }
}

// Executar validação
checkCoverage()

