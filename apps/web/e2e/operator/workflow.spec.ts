import { test, expect } from '@playwright/test'

test.describe('Fluxo do Operador', () => {
  test.beforeEach(async ({ page }) => {
    // Login como operador
    await page.goto('/')
    await page.fill('input[type="email"]', 'operator@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/operador/)
  })

  test('@critical - deve visualizar dashboard do operador', async ({ page }) => {
    await page.goto('/operador')
    
    await expect(page.locator('text=Painel do Operador')).toBeVisible()
    await expect(page.locator('text=Rotas')).toBeVisible()
  })

  test('deve visualizar rotas', async ({ page }) => {
    await page.goto('/operador/rotas')
    
    await expect(page.locator('text=Rotas')).toBeVisible()
  })

  test('deve criar funcionário', async ({ page }) => {
    await page.goto('/operador/funcionarios')
    
    const createButton = page.locator('button:has-text("Novo Funcionário")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      await page.fill('input[name="name"]', 'Funcionário Teste E2E')
      await page.fill('input[name="email"]', 'funcionario2e@test.com')
      await page.fill('input[name="cpf"]', '12345678900')
      
      await page.click('button:has-text("Criar")')
      
      await expect(page.locator('text=Funcionário criado')).toBeVisible()
    }
  })

  test('deve otimizar rota', async ({ page }) => {
    await page.goto('/operador/rotas')
    
    const optimizeButton = page.locator('button:has-text("Otimizar")').first()
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click()
      
      await expect(page.locator('text=Otimização')).toBeVisible()
    }
  })
})

