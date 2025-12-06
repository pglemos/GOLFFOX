/**
 * E2E Test: Gestão de Veículos (Admin)
 * Testa o fluxo completo de CRUD de veículos
 */

import { test, expect } from '@playwright/test'

test.describe('Admin - Gestão de Veículos', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/')
    await page.fill('input[type="email"]', 'golffox@admin.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento
    await page.waitForURL('/admin')
    
    // Navegar para veículos
    await page.goto('/admin/veiculos')
    await page.waitForLoadState('networkidle')
  })

  test('deve listar veículos', async ({ page }) => {
    // Verificar que a página carregou
    await expect(page.locator('h1, h2')).toContainText(/veículo/i)
    
    // Verificar se há tabela ou lista de veículos
    const table = page.locator('table, [role="table"]')
    await expect(table.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve criar novo veículo', async ({ page }) => {
    // Clicar em botão de criar
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Adicionar"), button:has-text("Novo")').first()
    await createButton.click()
    
    // Preencher formulário
    await page.fill('input[name="plate"], input[placeholder*="placa" i]', 'ABC-1234')
    await page.fill('input[name="model"], input[placeholder*="modelo" i]', 'Mercedes-Benz OF-1722')
    await page.fill('input[name="year"], input[placeholder*="ano" i]', '2020')
    
    // Salvar
    const saveButton = page.locator('button:has-text("Salvar"), button[type="submit"]').first()
    await saveButton.click()
    
    // Verificar sucesso (toast ou mensagem)
    await expect(page.locator('text=/sucesso|veículo criado/i')).toBeVisible({ timeout: 5000 })
  })

  test('deve editar veículo existente', async ({ page }) => {
    // Clicar no primeiro veículo da lista
    const firstRow = page.locator('table tbody tr, [role="row"]').first()
    await firstRow.click()
    
    // Editar campo
    const modelInput = page.locator('input[name="model"], input[placeholder*="modelo" i]').first()
    await modelInput.clear()
    await modelInput.fill('Modelo Atualizado')
    
    // Salvar
    await page.locator('button:has-text("Salvar")').first().click()
    
    // Verificar sucesso
    await expect(page.locator('text=/sucesso|atualizado/i')).toBeVisible({ timeout: 5000 })
  })

  test('deve filtrar veículos', async ({ page }) => {
    // Verificar se há campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('teste')
      await page.waitForTimeout(500) // Aguardar debounce
      
      // Verificar que resultados foram filtrados
      const rows = page.locator('table tbody tr, [role="row"]')
      await expect(rows.first()).toBeVisible()
    }
  })
})

