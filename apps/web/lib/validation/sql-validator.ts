/**
 * SQL Validator
 * 
 * Valida e sanitiza SQL antes de execução em rotas perigosas
 * Previne SQL injection e comandos destrutivos
 */

import { logError } from '@/lib/logger'

// Comandos permitidos (whitelist)
const ALLOWED_COMMANDS = [
  'ALTER TABLE',
  'CREATE OR REPLACE FUNCTION',
  'CREATE FUNCTION',
  'CREATE TRIGGER',
  'DROP TRIGGER',
  'UPDATE',
  'SELECT',
  'INSERT',
  'CREATE INDEX',
  'CREATE UNIQUE INDEX',
  'DROP INDEX',
  'COMMENT',
]

// Comandos perigosos (blacklist)
const DANGEROUS_COMMANDS = [
  'DROP TABLE',
  'DROP DATABASE',
  'DROP SCHEMA',
  'TRUNCATE',
  'DELETE FROM', // Sem WHERE é perigoso
  'EXEC',
  'EXECUTE',
  'EXECUTE IMMEDIATE',
]

// Padrões perigosos
const DANGEROUS_PATTERNS = [
  /;\s*DROP\s+TABLE/i,
  /;\s*TRUNCATE/i,
  /;\s*DELETE\s+FROM\s+\w+\s*;?$/i, // DELETE sem WHERE
  /;\s*DROP\s+DATABASE/i,
  /;\s*DROP\s+SCHEMA/i,
  /\bEXEC\s*\(/i,
  /\bEXECUTE\s*\(/i,
]

export interface SQLValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sanitized?: string
}

/**
 * Valida SQL antes de execução
 */
export function validateSQL(sql: string): SQLValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const upperSQL = sql.toUpperCase().trim()

  // 1. Verificar se está vazio
  if (!sql || sql.trim().length === 0) {
    return {
      valid: false,
      errors: ['SQL não pode estar vazio'],
      warnings: [],
    }
  }

  // 2. Verificar comandos perigosos (blacklist)
  for (const dangerous of DANGEROUS_COMMANDS) {
    const regex = new RegExp(`\\b${dangerous.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (regex.test(sql)) {
      errors.push(`Comando perigoso detectado: ${dangerous}`)
    }
  }

  // 3. Verificar padrões perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sql)) {
      errors.push(`Padrão perigoso detectado: ${pattern.source}`)
    }
  }

  // 4. Verificar se contém apenas comandos permitidos (whitelist)
  // Extrair primeiro comando
  const firstCommand = upperSQL.split(/\s+/)[0] + ' ' + (upperSQL.split(/\s+/)[1] || '')
  const hasAllowedCommand = ALLOWED_COMMANDS.some(cmd => 
    upperSQL.startsWith(cmd.toUpperCase())
  )

  if (!hasAllowedCommand) {
    warnings.push(`Comando não está na whitelist: ${firstCommand.trim()}`)
    // Não é erro fatal, apenas aviso
  }

  // 5. Verificar múltiplas statements (pode ser perigoso)
  const statementCount = sql.split(';').filter(s => s.trim().length > 0).length
  if (statementCount > 5) {
    warnings.push(`Múltiplas statements detectadas (${statementCount}). Verifique cuidadosamente.`)
  }

  // 6. Verificar tamanho (SQL muito grande pode ser suspeito)
  if (sql.length > 10000) {
    warnings.push(`SQL muito grande (${sql.length} caracteres). Verifique cuidadosamente.`)
  }

  // 7. Sanitizar (remover comentários e espaços extras)
  const sanitized = sql
    .replace(/--.*$/gm, '') // Remover comentários de linha
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentários de bloco
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim()

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: errors.length === 0 ? sanitized : undefined,
  }
}

/**
 * Valida SQL e lança erro se inválido
 */
export function validateSQLOrThrow(sql: string): string {
  const result = validateSQL(sql)
  
  if (!result.valid) {
    logError('SQL validation failed', {
      errors: result.errors,
      warnings: result.warnings,
      sqlLength: sql.length
    }, 'SQLValidator')
    
    throw new Error(`SQL inválido: ${result.errors.join(', ')}`)
  }

  if (result.warnings.length > 0) {
    logError('SQL validation warnings', {
      warnings: result.warnings,
      sqlLength: sql.length
    }, 'SQLValidator')
  }

  return result.sanitized || sql
}
