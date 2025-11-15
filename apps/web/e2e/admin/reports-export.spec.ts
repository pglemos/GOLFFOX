import { test, expect } from '@playwright/test'

test.describe('Admin - Exportação de Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/relatorios')
  })

  test('deve exportar relatório em CSV', async ({ page }) => {
    // Clicar em "Exportar" no card de um relatório
    const exportButton = page.locator('button:has-text("Exportar")').first()
    await exportButton.click()
    
    // Clicar em "Exportar CSV"
    await page.click('text=Exportar CSV')
    
    // Aguardar download (verificar se há download iniciado)
    // Em ambiente real, verificar se arquivo foi baixado
    await expect(page.locator('text=Relatório exportado')).toBeVisible({ timeout: 10000 })
  })

  test('deve exportar relatório em Excel', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Exportar")').first()
    await exportButton.click()
    
    await page.click('text=Exportar Excel')
    
    await expect(page.locator('text=Relatório exportado')).toBeVisible({ timeout: 10000 })
  })

  test('deve exportar relatório em PDF', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Exportar")').first()
    await exportButton.click()
    
    await page.click('text=Exportar PDF')
    
    await expect(page.locator('text=Relatório exportado')).toBeVisible({ timeout: 10000 })
  })
})

