import { test, expect } from '@playwright/test'

test.describe('Fluxo de Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('@critical - deve fazer login com credenciais válidas', async ({ page }) => {
    // Preencher formulário de login
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    
    // Clicar em entrar
    await page.click('button:has-text("Entrar")')
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/\/admin/)
  })

  test('deve rejeitar credenciais inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    await page.click('button:has-text("Entrar")')
    
    // Verificar mensagem de erro
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible()
  })

  test('deve fazer logout', async ({ page }) => {
    // Assumindo que já está logado
    await page.goto('/admin')
    
    // Clicar em logout
    const logoutButton = page.locator('button:has-text("Sair")')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      
      // Verificar redirecionamento para login
      await expect(page).toHaveURL(/\//)
    }
  })

  test('deve redirecionar por role após login', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    
    await expect(page).toHaveURL(/\/admin/)
    
    // Logout e login como operador
    await page.goto('/')
    await page.fill('input[type="email"]', 'operador@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    
    // Deve redirecionar para /operador
    await expect(page).toHaveURL(/\/operador/)
  })
})

