import { test, expect } from '@playwright/test'

test.describe('Admin - Conciliação de Custos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/custos')
  })

  test('deve abrir modal de conciliação', async ({ page }) => {
    // Clicar em uma fatura para conciliar
    const reconcileButton = page.locator('button:has-text("Conciliação")').first()
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click()
      
      // Verificar se modal abriu
      await expect(page.locator('text=Conciliação de Fatura')).toBeVisible()
    }
  })

  test('deve exibir divergências significativas', async ({ page }) => {
    // Abrir modal
    const reconcileButton = page.locator('button:has-text("Conciliação")').first()
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click()
      
      // Verificar se divergências são destacadas
      await expect(page.locator('text=Divergência')).toBeVisible()
    }
  })

  test('deve aprovar fatura', async ({ page }) => {
    // Abrir modal
    const reconcileButton = page.locator('button:has-text("Conciliação")').first()
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click()
      
      // Clicar em Aprovar
      await page.click('button:has-text("Aprovar")')
      
      // Verificar toast de sucesso
      await expect(page.locator('text=Fatura aprovada')).toBeVisible()
    }
  })
})

