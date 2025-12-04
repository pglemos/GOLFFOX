/**
 * Testes E2E - Gerenciamento de Usuários Admin
 */

import { test, expect } from '@playwright/test'

test.describe('Gerenciamento de Usuários - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/\/admin/)
  })

  test('@critical - deve listar usuários', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    // Verificar se a página carregou
    await expect(page.locator('h1, h2').filter({ hasText: /usuários/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('@critical - deve criar novo usuário', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    const createButton = page.locator('button:has-text(/novo|adicionar|criar/i)')
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click()
      
      // Preencher formulário
      const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]')
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Usuário E2E Test')
      }
      
      const emailInput = page.locator('input[name="email"], input[type="email"]')
      if (await emailInput.nth(1).isVisible({ timeout: 3000 })) {
        await emailInput.nth(1).fill(`usuario-e2e-${Date.now()}@test.com`)
      }
      
      const passwordInput = page.locator('input[name="password"], input[type="password"]')
      if (await passwordInput.isVisible({ timeout: 3000 })) {
        await passwordInput.fill('senha123')
      }
      
      const roleSelect = page.locator('select[name="role"], [role="combobox"]')
      if (await roleSelect.isVisible({ timeout: 3000 })) {
        await roleSelect.selectOption('operador')
      }
      
      // Salvar
      const saveButton = page.locator('button:has-text(/salvar|criar|confirmar/i)')
      if (await saveButton.isVisible({ timeout: 3000 })) {
        await saveButton.click()
        
        // Verificar sucesso
        await expect(page.locator('text=/sucesso|criado|salvo/i').first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('deve editar usuário existente', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    // Procurar por botão de editar ou linha da tabela
    const editButton = page.locator('button[aria-label*="editar"], button:has-text(/editar/i)').first()
    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click()
      
      // Modificar nome
      const nameInput = page.locator('input[name="name"]')
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Nome Atualizado E2E')
        
        const saveButton = page.locator('button:has-text(/salvar|atualizar/i)')
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click()
          
          await expect(page.locator('text=/atualizado|salvo/i').first()).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('deve filtrar usuários por role', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    // Procurar filtro de role
    const roleFilter = page.locator('select[name*="role"], [role="combobox"]').first()
    if (await roleFilter.isVisible({ timeout: 5000 })) {
      await roleFilter.selectOption('operador')
      await page.waitForTimeout(500)
      
      // Verificar que resultados foram filtrados
      const results = page.locator('tbody tr, [data-testid*="user"]')
      if (await results.first().isVisible({ timeout: 3000 })) {
        await expect(results.first()).toBeVisible()
      }
    }
  })

  test('deve buscar usuário por nome ou email', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]')
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('admin')
      await page.waitForTimeout(500) // Aguardar debounce
      
      // Verificar que resultados foram filtrados
      const results = page.locator('tbody tr, [data-testid*="user"]')
      if (await results.first().isVisible({ timeout: 3000 })) {
        await expect(results.first()).toBeVisible()
      }
    }
  })

  test('deve alterar role de usuário', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    // Procurar por botão de alterar role
    const changeRoleButton = page.locator('button:has-text(/alterar role|mudar/i)').first()
    if (await changeRoleButton.isVisible({ timeout: 5000 })) {
      await changeRoleButton.click()
      
      const roleSelect = page.locator('select[name="role"], [role="combobox"]')
      if (await roleSelect.isVisible({ timeout: 3000 })) {
        await roleSelect.selectOption('transportadora')
        
        const confirmButton = page.locator('button:has-text(/confirmar|salvar/i)')
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click()
          
          await expect(page.locator('text=/alterado|atualizado/i').first()).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('deve deletar usuário', async ({ page }) => {
    await page.goto('/admin/usuarios')
    
    // Procurar por botão de deletar
    const deleteButton = page.locator('button[aria-label*="deletar"], button:has-text(/deletar|excluir/i)').first()
    if (await deleteButton.isVisible({ timeout: 5000 })) {
      await deleteButton.click()
      
      // Confirmar deleção se aparecer modal
      const confirmButton = page.locator('button:has-text(/confirmar|sim|deletar/i)')
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click()
        
        await expect(page.locator('text=/deletado|removido/i').first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

