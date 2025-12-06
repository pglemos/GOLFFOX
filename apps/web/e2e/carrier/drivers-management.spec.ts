/**
 * E2E Test: Gestão de Motoristas (Transportadora)
 */

import { test, expect } from '@playwright/test'

test.describe('Transportadora - Gestão de Motoristas', () => {
  test.beforeEach(async ({ page }) => {
    // Login como transportadora
    await page.goto('/')
    await page.fill('input[type="email"]', 'transportadora@trans.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/transportadora/)
    await page.goto('/transportadora/motoristas')
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir lista de motoristas', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/motorista/i)
    
    const content = page.locator('table, [role="table"], .grid, .flex')
    await expect(content.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve exibir métricas de motoristas', async ({ page }) => {
    // Verificar KPIs ou cards de métricas
    const metrics = page.locator('text=/motoristas ativos|total|viagens/i')
    await expect(metrics.first()).toBeVisible({ timeout: 5000 })
  })
})

