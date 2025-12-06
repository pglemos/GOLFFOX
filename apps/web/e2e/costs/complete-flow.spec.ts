/**
 * E2E Test: Fluxo Completo de Custos
 * Testa criação, conciliação e relatórios de custos
 */

import { test, expect } from '@playwright/test'

test.describe('Custos - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'golffox@admin.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('deve acessar módulo de custos', async ({ page }) => {
    await page.goto('/admin/custos')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1, h2')).toContainText(/custo/i)
  })

  test('deve criar custo manual', async ({ page }) => {
    await page.goto('/admin/custos')
    await page.waitForLoadState('networkidle')
    
    // Procurar botão de adicionar custo
    const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Criar"), button:has-text("Novo")').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Preencher formulário se modal abrir
      const amountInput = page.locator('input[name="amount"], input[placeholder*="valor" i]').first()
      if (await amountInput.isVisible()) {
        await amountInput.fill('100.50')
        await page.locator('button:has-text("Salvar")').first().click()
        await expect(page.locator('text=/sucesso/i')).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
