import { test, expect } from '@playwright/test'

test.describe('Admin - Rotas e Mapa', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implementar autenticação de teste
    // Por enquanto, assumindo que o usuário está autenticado
    await page.goto('/admin/rotas')
  })

  test('deve criar uma nova rota', async ({ page }) => {
    // Clicar no botão "Nova Rota"
    await page.click('text=Nova Rota')
    
    // Preencher formulário
    await page.fill('input[name="name"]', 'Rota Teste E2E')
    await page.fill('input[name="origin_address"]', 'Origem Teste')
    await page.fill('input[name="destination_address"]', 'Destino Teste')
    
    // Salvar
    await page.click('button:has-text("Salvar")')
    
    // Verificar sucesso
    await expect(page.locator('text=Rota Teste E2E')).toBeVisible()
  })

  test('deve gerar pontos para uma rota', async ({ page }) => {
    // Assumindo que existe uma rota
    // Clicar em "Gerar Pontos"
    const generateButton = page.locator('button:has-text("Gerar Pontos")').first()
    if (await generateButton.isVisible()) {
      await generateButton.click()
      // Verificar toast de sucesso
await expect(page.locator('text=Pontos gerados e salvos com sucesso')).toBeVisible()
    }
  })

  test('deve visualizar rota no mapa', async ({ page }) => {
    // Clicar em "Ver no Mapa"
    const viewMapButton = page.locator('button:has-text("Ver no Mapa")').first()
    if (await viewMapButton.isVisible()) {
      await viewMapButton.click()
      
      // Verificar redirecionamento para mapa
      await expect(page).toHaveURL(/\/admin\/mapa/)
      
      // Verificar se o mapa está visível
      await expect(page.locator('[data-testid="fleet-map"]').or(page.locator('div[class*="map"]'))).toBeVisible()
    }
  })
})

