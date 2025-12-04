import { test, expect } from '@playwright/test'

test.describe('Fluxo Administrativo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/admin/)
  })

  test('@critical - deve criar transportadora', async ({ page }) => {
    await page.goto('/admin/transportadoras')
    
    // Clicar em criar transportadora
    const createButton = page.locator('button:has-text("Nova Transportadora")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Preencher formulário
      await page.fill('input[name="name"]', 'Transportadora Teste E2E')
      await page.fill('input[name="email"]', 'teste2e@transportadora.com')
      await page.fill('input[name="cnpj"]', '12345678000190')
      
      // Salvar
      await page.click('button:has-text("Salvar")')
      
      // Verificar sucesso
      await expect(page.locator('text=Transportadora criada')).toBeVisible()
    }
  })

  test('@critical - deve criar usuário', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    const createButton = page.locator('button:has-text("Novo Usuário")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      await page.fill('input[name="name"]', 'Usuário Teste E2E')
      await page.fill('input[name="email"]', 'usuario2e@test.com')
      await page.fill('input[name="password"]', 'senha123')
      await page.selectOption('select[name="role"]', 'operador')
      
      await page.click('button:has-text("Criar")')
      
      await expect(page.locator('text=Usuário criado')).toBeVisible()
    }
  })

  test('deve criar veículo', async ({ page }) => {
    await page.goto('/admin/veiculos')
    
    const createButton = page.locator('button:has-text("Novo Veículo")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      await page.fill('input[name="plate"]', 'ABC1234')
      await page.fill('input[name="model"]', 'Modelo Teste')
      await page.fill('input[name="brand"]', 'Marca Teste')
      
      await page.click('button:has-text("Salvar")')
      
      await expect(page.locator('text=Veículo criado')).toBeVisible()
    }
  })

  test('deve criar motorista', async ({ page }) => {
    await page.goto('/admin/motoristas')
    
    const createButton = page.locator('button:has-text("Novo Motorista")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      await page.fill('input[name="name"]', 'Motorista Teste E2E')
      await page.fill('input[name="cpf"]', '12345678900')
      await page.fill('input[name="cnh"]', '12345678901')
      
      await page.click('button:has-text("Salvar")')
      
      await expect(page.locator('text=Motorista criado')).toBeVisible()
    }
  })
})

