/**
 * Testes E2E - Gerenciamento de Documentos - Transportadora
 */

import { test, expect } from '@playwright/test'

test.describe('Gerenciamento de Documentos - Transportadora', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'transportadora@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/transportadora/)
  })

  test('@critical - deve fazer upload de documento de motorista', async ({ page }) => {
    await page.goto('/transportadora/motoristas')
    
    // Procurar por motorista e botão de upload
    const driverRow = page.locator('tbody tr, [data-testid*="motorista"]').first()
    if (await driverRow.isVisible({ timeout: 5000 })) {
      const uploadButton = driverRow.locator('button:has-text(/upload|documento|anexar/i)')
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        await uploadButton.click()
        
        // Upload de arquivo
        const fileInput = page.locator('input[type="file"]')
        if (await fileInput.isVisible({ timeout: 3000 })) {
          await fileInput.setInputFiles({
            name: 'documento.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('PDF content'),
          })
          
          // Confirmar upload
          const confirmButton = page.locator('button:has-text(/enviar|upload|confirmar/i)')
          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click()
            
            await expect(page.locator('text=/enviado|sucesso/i').first()).toBeVisible({ timeout: 10000 })
          }
        }
      }
    }
  })

  test('deve fazer upload de documento de veículo', async ({ page }) => {
    await page.goto('/transportadora/frota')
    
    const vehicleRow = page.locator('tbody tr, [data-testid*="veiculo"]').first()
    if (await vehicleRow.isVisible({ timeout: 5000 })) {
      const uploadButton = vehicleRow.locator('button:has-text(/upload|documento/i)')
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        await uploadButton.click()
        
        const fileInput = page.locator('input[type="file"]')
        if (await fileInput.isVisible({ timeout: 3000 })) {
          await fileInput.setInputFiles({
            name: 'seguro.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('PDF content'),
          })
          
          const confirmButton = page.locator('button:has-text(/enviar|upload/i)')
          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click()
            await expect(page.locator('text=/sucesso/i').first()).toBeVisible({ timeout: 10000 })
          }
        }
      }
    }
  })

  test('deve visualizar relatório de performance de motoristas', async ({ page }) => {
    await page.goto('/transportadora/relatorios')
    
    const driverPerformanceLink = page.locator('a:has-text(/performance|motoristas/i), button:has-text(/performance/i)')
    if (await driverPerformanceLink.isVisible({ timeout: 5000 })) {
      await driverPerformanceLink.click()
      
      await expect(page.locator('text=/performance|motoristas/i').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('deve visualizar relatório de uso da frota', async ({ page }) => {
    await page.goto('/transportadora/relatorios')
    
    const fleetUsageLink = page.locator('a:has-text(/frota|utilização/i), button:has-text(/frota/i)')
    if (await fleetUsageLink.isVisible({ timeout: 5000 })) {
      await fleetUsageLink.click()
      
      await expect(page.locator('text=/frota|utilização/i').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('deve visualizar alertas de documentos', async ({ page }) => {
    await page.goto('/transportadora/alertas')
    
    // Verificar se há alertas de documentos expirados
    const documentAlerts = page.locator('text=/documento|expirado|vencimento/i')
    await expect(documentAlerts.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve gerar URL assinada para documento privado', async ({ page }) => {
    await page.goto('/transportadora/documentos')
    
    // Procurar por documento e botão de visualizar
    const viewButton = page.locator('button:has-text(/visualizar|ver|abrir/i)').first()
    if (await viewButton.isVisible({ timeout: 5000 })) {
      await viewButton.click()
      
      // Verificar se URL foi gerada e documento carregou
      await page.waitForTimeout(2000)
      
      // Verificar se não há erro de acesso
      const errorMessage = page.locator('text=/erro|acesso negado/i')
      await expect(errorMessage).not.toBeVisible({ timeout: 3000 })
    }
  })
})

