import { test, expect } from '@playwright/test'

test.describe('Fluxo de Transportadora', () => {
  test.beforeEach(async ({ page }) => {
    // Login como transportadora
    await page.goto('/')
    await page.fill('input[type="email"]', 'transportadora@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/transportadora/)
  })

  test('@critical - deve visualizar dashboard da transportadora', async ({ page }) => {
    await page.goto('/transportadora')
    
    await expect(page.locator('text=Painel da Transportadora')).toBeVisible()
    await expect(page.locator('text=Frota')).toBeVisible()
  })

  test('deve visualizar frota', async ({ page }) => {
    await page.goto('/transportadora/frota')
    
    await expect(page.locator('text=Frota')).toBeVisible()
  })

  test('deve visualizar relatórios', async ({ page }) => {
    await page.goto('/transportadora/relatorios')
    
    await expect(page.locator('text=Relatórios')).toBeVisible()
  })

  test('deve gerenciar motoristas', async ({ page }) => {
    await page.goto('/transportadora/motoristas')
    
    await expect(page.locator('text=Motoristas')).toBeVisible()
  })

  test('deve fazer upload de documentos', async ({ page }) => {
    await page.goto('/transportadora/documentos')
    
    const uploadButton = page.locator('button:has-text("Upload")')
    if (await uploadButton.isVisible()) {
      await uploadButton.click()
      
      await expect(page.locator('text=Upload de Documento')).toBeVisible()
    }
  })
})

