import { test, expect } from '@playwright/test'

test.describe('Admin Transportadoras - Mobile', () => {
  test('Renderiza corretamente e permite criar', async ({ page }) => {
    await page.route('**/api/admin/carriers-list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, carriers: [] }),
      })
    })

    await page.goto('/admin/transportadoras')

    await expect(page.getByText('Transportadoras')).toBeVisible()
    await expect(page.getByRole('button', { name: /Criar/ })).toBeVisible()

    await expect(page.getByText('Nenhuma transportadora cadastrada')).toBeVisible()
  })
})
