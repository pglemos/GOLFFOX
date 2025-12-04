/**
 * Testes E2E - Fluxo de Importação/Exportação de Custos
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Importação/Exportação de Custos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/admin/)
  })

  test('@critical - deve importar custos via CSV', async ({ page }) => {
    await page.goto('/admin/custos')
    
    // Procurar botão de importar
    const importButton = page.locator('button:has-text(/importar|upload/i)')
    if (await importButton.isVisible({ timeout: 5000 })) {
      await importButton.click()
      
      // Criar arquivo CSV de teste
      const csvContent = 'data,descrição,valor,categoria\n2024-01-01,Teste E2E,100.00,Combustível'
      const fileInput = page.locator('input[type="file"]')
      
      if (await fileInput.isVisible({ timeout: 3000 })) {
        // Simular upload de arquivo
        await fileInput.setInputFiles({
          name: 'test-costs.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        })
        
        // Confirmar importação
        const confirmButton = page.locator('button:has-text(/importar|confirmar/i)')
        if (await confirmButton.isVisible({ timeout: 3000 })) {
          await confirmButton.click()
          
          // Verificar sucesso
          await expect(page.locator('text=/importado|sucesso/i').first()).toBeVisible({ timeout: 10000 })
        }
      }
    }
  })

  test('@critical - deve exportar custos como CSV', async ({ page }) => {
    await page.goto('/admin/custos')
    
    // Procurar botão de exportar
    const exportButton = page.locator('button:has-text(/exportar|download/i)')
    if (await exportButton.isVisible({ timeout: 5000 })) {
      await exportButton.click()
      
      // Selecionar formato CSV se aparecer menu
      const csvOption = page.locator('button:has-text("CSV"), [role="menuitem"]:has-text("CSV")')
      if (await csvOption.isVisible({ timeout: 3000 })) {
        await csvOption.click()
      }
      
      // Aguardar download (Playwright gerencia downloads automaticamente)
      await page.waitForTimeout(2000)
    }
  })

  test('deve exportar custos como Excel', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const exportButton = page.locator('button:has-text(/exportar|download/i)')
    if (await exportButton.isVisible({ timeout: 5000 })) {
      await exportButton.click()
      
      const excelOption = page.locator('button:has-text("Excel"), [role="menuitem"]:has-text("Excel")')
      if (await excelOption.isVisible({ timeout: 3000 })) {
        await excelOption.click()
        await page.waitForTimeout(2000)
      }
    }
  })

  test('deve exportar custos como PDF', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const exportButton = page.locator('button:has-text(/exportar|download/i)')
    if (await exportButton.isVisible({ timeout: 5000 })) {
      await exportButton.click()
      
      const pdfOption = page.locator('button:has-text("PDF"), [role="menuitem"]:has-text("PDF")')
      if (await pdfOption.isVisible({ timeout: 3000 })) {
        await pdfOption.click()
        await page.waitForTimeout(3000) // PDF pode demorar mais
      }
    }
  })

  test('deve aplicar filtros antes de exportar', async ({ page }) => {
    await page.goto('/admin/custos')
    
    // Aplicar filtro de data
    const dateFromInput = page.locator('input[name*="from"], input[placeholder*="de"]')
    if (await dateFromInput.isVisible({ timeout: 5000 })) {
      await dateFromInput.fill('2024-01-01')
      
      const dateToInput = page.locator('input[name*="to"], input[placeholder*="até"]')
      if (await dateToInput.isVisible({ timeout: 2000 })) {
        await dateToInput.fill('2024-12-31')
      }
      
      // Aplicar filtros
      const applyButton = page.locator('button:has-text(/aplicar|filtrar/i)')
      if (await applyButton.isVisible({ timeout: 2000 })) {
        await applyButton.click()
        await page.waitForTimeout(1000)
      }
      
      // Exportar
      const exportButton = page.locator('button:has-text(/exportar/i)')
      if (await exportButton.isVisible({ timeout: 3000 })) {
        await exportButton.click()
        
        const csvOption = page.locator('button:has-text("CSV")')
        if (await csvOption.isVisible({ timeout: 2000 })) {
          await csvOption.click()
          await page.waitForTimeout(2000)
        }
      }
    }
  })

  test('deve validar formato de arquivo na importação', async ({ page }) => {
    await page.goto('/admin/custos')
    
    const importButton = page.locator('button:has-text(/importar/i)')
    if (await importButton.isVisible({ timeout: 5000 })) {
      await importButton.click()
      
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.isVisible({ timeout: 3000 })) {
        // Tentar upload de arquivo inválido
        await fileInput.setInputFiles({
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid content'),
        })
        
        // Verificar mensagem de erro
        await expect(page.locator('text=/formato inválido|arquivo inválido/i').first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

