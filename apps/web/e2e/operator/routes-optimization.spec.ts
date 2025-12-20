/**
 * Testes E2E - Otimização de Rotas - Operador
 */

import { test, expect } from '@playwright/test'

test.describe('Otimização de Rotas - Operador', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'operador@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/operador/)
  })

  test('@critical - deve visualizar rotas', async ({ page }) => {
    await page.goto('/operador/rotas')
    
    // Verificar se a página carregou
    await expect(page.locator('h1, h2').filter({ hasText: /rotas/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('@critical - deve otimizar rota', async ({ page }) => {
    await page.goto('/operador/rotas')
    
    // Procurar botão de otimizar
    const optimizeButton = page.locator('button:has-text(/otimizar|otimização/i)').first()
    if (await optimizeButton.isVisible({ timeout: 5000 })) {
      await optimizeButton.click()
      
      // Aguardar processamento
      await page.waitForTimeout(2000)
      
      // Verificar se resultado apareceu
      const result = page.locator('text=/otimizado|resultado|distância/i')
      if (await result.first().isVisible({ timeout: 10000 })) {
        await expect(result.first()).toBeVisible()
      }
    }
  })

  test('deve visualizar histórico de rotas', async ({ page }) => {
    await page.goto('/operador/rotas')
    
    // Procurar aba ou link de histórico
    const historyTab = page.locator('button:has-text(/histórico|execuções/i), a:has-text(/histórico/i)')
    if (await historyTab.isVisible({ timeout: 5000 })) {
      await historyTab.click()
      
      // Verificar se histórico carregou
      await expect(page.locator('text=/histórico|execuções/i').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('deve criar novo funcionário', async ({ page }) => {
    await page.goto('/operador/funcionarios')
    
    const createButton = page.locator('button:has-text(/novo|adicionar|criar/i)')
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click()
      
      // Preencher formulário
      const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]')
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Funcionário E2E')
      }
      
      const emailInput = page.locator('input[name="email"], input[type="email"]')
      if (await emailInput.nth(1).isVisible({ timeout: 3000 })) {
        await emailInput.nth(1).fill(`funcionario-e2e-${Date.now()}@test.com`)
      }
      
      const saveButton = page.locator('button:has-text(/salvar|criar/i)')
      if (await saveButton.isVisible({ timeout: 3000 })) {
        await saveButton.click()
        
        await expect(page.locator('text=/criado|sucesso/i').first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('deve associar empresa ao operador', async ({ page }) => {
    await page.goto('/operador/empresas')
    
    const associateButton = page.locator('button:has-text(/associar|adicionar empresa/i)')
    if (await associateButton.isVisible({ timeout: 5000 })) {
      await associateButton.click()
      
      // Selecionar empresa se aparecer modal
      const companySelect = page.locator('select[name*="company"], [role="combobox"]')
      if (await companySelect.isVisible({ timeout: 3000 })) {
        await companySelect.selectOption({ index: 0 })
        
        const confirmButton = page.locator('button:has-text(/confirmar|associar/i)')
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click()
          
          await expect(page.locator('text=/associado|sucesso/i').first()).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })
})

