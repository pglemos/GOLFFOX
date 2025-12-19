/**
 * Testes E2E: Fluxos Críticos
 * 
 * Testes end-to-end para fluxos críticos do sistema
 */

import { test, expect } from '@playwright/test'

test.describe('Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: fazer login como admin
    await page.goto('http://localhost:3000')
    // ... login steps
  })

  test('deve criar empresa completa', async ({ page }) => {
    // 1. Criar empresa
    await page.goto('http://localhost:3000/admin/companies')
    await page.click('button:has-text("Nova Empresa")')
    await page.fill('input[name="name"]', 'Empresa Teste')
    await page.fill('input[name="email"]', 'teste@empresa.com')
    await page.click('button:has-text("Salvar")')

    // 2. Verificar que empresa foi criada
    await expect(page.locator('text=Empresa Teste')).toBeVisible()
  })

  test('deve criar rota e associar à empresa', async ({ page }) => {
    // 1. Criar rota
    await page.goto('http://localhost:3000/admin/routes')
    await page.click('button:has-text("Nova Rota")')
    await page.fill('input[name="name"]', 'Rota Teste')
    await page.selectOption('select[name="company"]', 'Empresa Teste')
    await page.click('button:has-text("Salvar")')

    // 2. Verificar que rota foi criada
    await expect(page.locator('text=Rota Teste')).toBeVisible()
  })

  test('deve criar viagem e rastrear', async ({ page }) => {
    // 1. Criar viagem
    await page.goto('http://localhost:3000/admin/trips')
    await page.click('button:has-text("Nova Viagem")')
    await page.selectOption('select[name="route"]', 'Rota Teste')
    await page.selectOption('select[name="vehicle"]', 'Veículo Teste')
    await page.click('button:has-text("Iniciar Viagem")')

    // 2. Verificar que viagem está ativa
    await expect(page.locator('text=Viagem em andamento')).toBeVisible()
  })
})
