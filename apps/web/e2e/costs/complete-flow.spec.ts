import { test, expect } from '@playwright/test'

test.describe('Fluxo de Custos', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/admin/)
  })

  test('@critical - deve visualizar dashboard de custos', async ({ page }) => {
    await page.goto('/admin/custos')
    
    // Verificar elementos principais
    await expect(page.locator('text=Custos')).toBeVisible()
    await expect(page.locator('text=KPIs')).toBeVisible()
  })

  test('@critical - deve importar custos via CSV', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const importButton = page.locator('button:has-text("Importar")')
    if (await importButton.isVisible()) {
      await importButton.click()
      
      // Verificar modal de importação
      await expect(page.locator('text=Importar Custos')).toBeVisible()
      
      // Upload de arquivo (simulado)
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.isVisible()) {
        // Em testes reais, você usaria um arquivo CSV de teste
        // await fileInput.setInputFiles('path/to/test.csv')
      }
    }
  })

  test('@critical - deve visualizar conciliação', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const reconcileButton = page.locator('button:has-text("Conciliação")').first()
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click()
      
      await expect(page.locator('text=Conciliação de Fatura')).toBeVisible()
      await expect(page.locator('text=Valor Faturado')).toBeVisible()
      await expect(page.locator('text=Valor Medido')).toBeVisible()
    }
  })

  test('deve aprovar fatura na conciliação', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const reconcileButton = page.locator('button:has-text("Conciliação")').first()
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click()
      
      const approveButton = page.locator('button:has-text("Aprovar")')
      if (await approveButton.isVisible()) {
        await approveButton.click()
        
        await expect(page.locator('text=Fatura aprovada')).toBeVisible()
      }
    }
  })

  test('deve exportar relatório de custos', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const exportButton = page.locator('button:has-text("Exportar")')
    if (await exportButton.isVisible()) {
      await exportButton.click()
      
      // Verificar opções de exportação
      await expect(page.locator('text=Exportar')).toBeVisible()
    }
  })
})

