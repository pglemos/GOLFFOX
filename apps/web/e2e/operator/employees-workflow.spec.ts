/**
 * E2E Test: Fluxo de Funcionários (Operador)
 * Testa criação, edição e listagem de funcionários
 */

import { test, expect } from '@playwright/test'

test.describe('Operador - Gestão de Funcionários', () => {
  test.beforeEach(async ({ page }) => {
    // Login como operador
    await page.goto('/')
    await page.fill('input[type="email"]', 'operador@empresa.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/operador/)
    
    // Navegar para funcionários
    await page.goto('/operador/funcionarios')
    await page.waitForLoadState('networkidle')
  })

  test('deve listar funcionários', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/funcionário/i)
    
    const table = page.locator('table, [role="table"]')
    await expect(table.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve criar novo funcionário', async ({ page }) => {
    // Clicar em criar
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Adicionar")').first()
    await createButton.click()
    
    // Preencher formulário
    await page.fill('input[name="name"], input[placeholder*="nome" i]', 'João Silva')
    await page.fill('input[name="email"], input[type="email"]', `joao.silva.${Date.now()}@teste.com`)
    await page.fill('input[name="phone"], input[placeholder*="telefone" i]', '(11) 99999-9999')
    
    // Salvar
    await page.locator('button:has-text("Salvar"), button[type="submit"]').first().click()
    
    // Verificar sucesso
    await expect(page.locator('text=/sucesso|funcionário criado/i')).toBeVisible({ timeout: 5000 })
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Adicionar")').first()
    await createButton.click()
    
    // Tentar salvar sem preencher
    await page.locator('button:has-text("Salvar")').first().click()
    
    // Verificar mensagem de erro
    await expect(page.locator('text=/obrigatório|preencha/i')).toBeVisible({ timeout: 3000 })
  })
})

