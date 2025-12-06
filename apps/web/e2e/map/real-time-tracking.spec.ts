/**
 * E2E Test: Rastreamento em Tempo Real no Mapa
 */

import { test, expect } from '@playwright/test'

test.describe('Mapa - Rastreamento em Tempo Real', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'golffox@admin.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('deve carregar mapa da frota', async ({ page }) => {
    await page.goto('/admin/mapa')
    await page.waitForLoadState('networkidle')
    
    // Verificar se mapa carregou (Google Maps ou componente de mapa)
    const mapContainer = page.locator('[id*="map"], .map-container, [class*="map"]').first()
    await expect(mapContainer).toBeVisible({ timeout: 15000 })
  })

  test('deve exibir controles do mapa', async ({ page }) => {
    await page.goto('/admin/mapa')
    await page.waitForLoadState('networkidle')
    
    // Verificar filtros ou controles
    const controls = page.locator('button, select, input[type="checkbox"]')
    await expect(controls.first()).toBeVisible({ timeout: 5000 })
  })
})

