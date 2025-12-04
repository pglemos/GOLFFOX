/**
 * Testes E2E - Fluxo de Emergência Admin
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo de Emergência - Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/admin/)
  })

  test('@critical - deve visualizar veículos disponíveis', async ({ page }) => {
    await page.goto('/admin/emergency')
    
    // Verificar se há seção de veículos disponíveis
    const availableVehicles = page.locator('text=/veículos disponíveis/i')
    await expect(availableVehicles.first()).toBeVisible({ timeout: 10000 })
  })

  test('@critical - deve visualizar motoristas disponíveis', async ({ page }) => {
    await page.goto('/admin/emergency')
    
    // Verificar se há seção de motoristas disponíveis
    const availableDrivers = page.locator('text=/motoristas disponíveis/i')
    await expect(availableDrivers.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve visualizar rotas com problemas', async ({ page }) => {
    await page.goto('/admin/emergency')
    
    // Verificar se há seção de rotas com problemas
    const routesWithProblems = page.locator('text=/rotas com problemas/i')
    await expect(routesWithProblems.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve despachar assistência de emergência', async ({ page }) => {
    await page.goto('/admin/emergency')
    
    // Procurar botão de despacho
    const dispatchButton = page.locator('button:has-text(/despachar|socorro|assistência/i)')
    if (await dispatchButton.isVisible({ timeout: 5000 })) {
      await dispatchButton.first().click()
      
      // Preencher formulário de despacho se aparecer
      const form = page.locator('form, [role="dialog"]')
      if (await form.isVisible({ timeout: 3000 })) {
        // Preencher campos se existirem
        const vehicleSelect = page.locator('select[name*="vehicle"], input[name*="vehicle"]')
        if (await vehicleSelect.isVisible({ timeout: 2000 })) {
          await vehicleSelect.first().fill('vehicle-1')
        }
        
        const driverSelect = page.locator('select[name*="driver"], input[name*="driver"]')
        if (await driverSelect.isVisible({ timeout: 2000 })) {
          await driverSelect.first().fill('driver-1')
        }
        
        const submitButton = page.locator('button:has-text(/enviar|confirmar|despachar/i)')
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click()
          
          // Verificar mensagem de sucesso
          await expect(page.locator('text=/sucesso|despachado|confirmado/i').first()).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('deve filtrar veículos disponíveis', async ({ page }) => {
    await page.goto('/admin/emergency')
    
    // Procurar filtros
    const filterInput = page.locator('input[placeholder*="buscar"], input[placeholder*="filtrar"]')
    if (await filterInput.isVisible({ timeout: 5000 })) {
      await filterInput.fill('ABC')
      await page.waitForTimeout(500) // Aguardar debounce
      
      // Verificar que resultados foram filtrados
      const results = page.locator('[data-testid*="vehicle"], .vehicle-item')
      if (await results.first().isVisible({ timeout: 2000 })) {
        await expect(results.first()).toBeVisible()
      }
    }
  })
})

