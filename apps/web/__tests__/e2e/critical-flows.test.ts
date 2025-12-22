/**
 * Testes E2E: Fluxos Críticos
 * 
 * Testes end-to-end para fluxos críticos do sistema
 * Usa seletores semânticos e data-testid para robustez
 */

import { test, expect } from '@playwright/test'

test.describe('Critical Flows', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'golffox@admin.com'
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'senha123'

  /**
   * Helper para fazer login como admin
   */
  async function loginAsAdmin(page: any) {
    await page.goto(`${baseURL}/login`)
    
    // Usar seletores semânticos
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
    const passwordInput = page.getByLabel(/senha|password/i).or(page.getByPlaceholder(/senha|password/i))
    const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i })

    await emailInput.fill(adminEmail)
    await passwordInput.fill(adminPassword)
    await submitButton.click()

    // Aguardar redirecionamento após login
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    // Fazer login como admin antes de cada teste
    await loginAsAdmin(page)
  })

  test('deve criar empresa completa', async ({ page }) => {
    // 1. Navegar para página de empresas
    await page.goto(`${baseURL}/admin/companies`)
    await page.waitForLoadState('networkidle')

    // 2. Clicar no botão de nova empresa (usar role ou data-testid se disponível)
    const newCompanyButton = page.getByRole('button', { name: /nova empresa|adicionar empresa|create company/i })
      .or(page.locator('[data-testid="new-company-button"]'))
      .first()
    
    await newCompanyButton.click()
    await page.waitForTimeout(500) // Aguardar modal abrir

    // 3. Preencher formulário usando seletores semânticos
    const nameInput = page.getByLabel(/nome|name/i).or(page.locator('input[name="name"]'))
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[name="email"]'))
    
    await nameInput.fill('Empresa Teste E2E')
    await emailInput.fill('teste-e2e@empresa.com')

    // 4. Submeter formulário
    const saveButton = page.getByRole('button', { name: /salvar|save|confirmar|confirm/i })
      .or(page.locator('[data-testid="save-button"]'))
    
    await saveButton.click()

    // 5. Aguardar confirmação e verificar que empresa foi criada
    await page.waitForTimeout(1000) // Aguardar requisição completar
    
    // Verificar que empresa aparece na lista ou mensagem de sucesso
    await expect(
      page.getByText(/empresa teste e2e|empresa criada|empresa cadastrada/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('deve criar rota e associar à empresa', async ({ page }) => {
    // 1. Navegar para página de rotas
    await page.goto(`${baseURL}/admin/routes`)
    await page.waitForLoadState('networkidle')

    // 2. Clicar no botão de nova rota
    const newRouteButton = page.getByRole('button', { name: /nova rota|adicionar rota|create route/i })
      .or(page.locator('[data-testid="new-route-button"]'))
      .first()
    
    await newRouteButton.click()
    await page.waitForTimeout(500)

    // 3. Preencher formulário
    const nameInput = page.getByLabel(/nome|name/i).or(page.locator('input[name="name"]'))
    await nameInput.fill('Rota Teste E2E')

    // Selecionar empresa (usar select ou combobox)
    const companySelect = page.getByLabel(/empresa|company/i)
      .or(page.locator('select[name="company"]'))
      .or(page.locator('[data-testid="company-select"]'))
    
    if (await companySelect.count() > 0) {
      await companySelect.selectOption({ index: 1 }) // Selecionar primeira opção disponível
    }

    // 4. Submeter
    const saveButton = page.getByRole('button', { name: /salvar|save|confirmar/i })
    await saveButton.click()

    // 5. Verificar que rota foi criada
    await page.waitForTimeout(1000)
    await expect(
      page.getByText(/rota teste e2e|rota criada|rota cadastrada/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('deve criar viagem e rastrear', async ({ page }) => {
    // 1. Navegar para página de viagens
    await page.goto(`${baseURL}/admin/trips`)
    await page.waitForLoadState('networkidle')

    // 2. Clicar no botão de nova viagem
    const newTripButton = page.getByRole('button', { name: /nova viagem|adicionar viagem|create trip/i })
      .or(page.locator('[data-testid="new-trip-button"]'))
      .first()
    
    await newTripButton.click()
    await page.waitForTimeout(500)

    // 3. Preencher formulário
    // Selecionar rota
    const routeSelect = page.getByLabel(/rota|route/i)
      .or(page.locator('select[name="route"]'))
      .or(page.locator('[data-testid="route-select"]'))
    
    if (await routeSelect.count() > 0) {
      await routeSelect.selectOption({ index: 1 })
    }

    // Selecionar veículo
    const vehicleSelect = page.getByLabel(/veículo|vehicle|veiculo/i)
      .or(page.locator('select[name="veiculo"]'))
      .or(page.locator('[data-testid="vehicle-select"]'))
    
    if (await vehicleSelect.count() > 0) {
      await vehicleSelect.selectOption({ index: 1 })
    }

    // 4. Iniciar viagem
    const startButton = page.getByRole('button', { name: /iniciar viagem|start trip|iniciar/i })
    await startButton.click()

    // 5. Verificar que viagem está ativa
    await page.waitForTimeout(1000)
    await expect(
      page.getByText(/viagem em andamento|trip in progress|viagem ativa/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Este teste é executado no beforeEach, mas podemos testar explicitamente
    await page.goto(`${baseURL}/login`)
    
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
    const passwordInput = page.getByLabel(/senha|password/i).or(page.getByPlaceholder(/senha|password/i))
    const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i })

    await emailInput.fill(adminEmail)
    await passwordInput.fill(adminPassword)
    await submitButton.click()

    // Verificar redirecionamento para área autenticada
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 })
    
    // Verificar que não estamos mais na página de login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('deve rejeitar login com credenciais inválidas', async ({ page }) => {
    await page.goto(`${baseURL}/login`)
    
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
    const passwordInput = page.getByLabel(/senha|password/i).or(page.getByPlaceholder(/senha|password/i))
    const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i })

    await emailInput.fill('invalid@email.com')
    await passwordInput.fill('wrongpassword')
    await submitButton.click()

    // Verificar mensagem de erro
    await expect(
      page.getByText(/credenciais inválidas|invalid credentials|erro ao fazer login/i)
    ).toBeVisible({ timeout: 5000 })
    
    // Verificar que ainda estamos na página de login
    await expect(page).toHaveURL(/\/login/)
  })
})
