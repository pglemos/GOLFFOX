/**
 * E2E Test: Criação de Rotas
 */

import { test, expect } from '@playwright/test'

test.describe('Criação de Rotas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'golffox@admin.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('deve acessar página de rotas', async ({ page }) => {
    await page.goto('/admin/rotas')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1, h2')).toContainText(/rota/i)
  })

  test('deve abrir modal de criação de rota', async ({ page }) => {
    await page.goto('/admin/rotas')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Nova Rota")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Verificar se modal abriu
      await expect(page.locator('[role="dialog"], .modal, [data-state="open"]')).toBeVisible({ timeout: 3000 })
    }
  })
})

