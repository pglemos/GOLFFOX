import { test, expect } from '@playwright/test'

test('Sidebar mobile: opens and shows menu items', async ({ page }) => {
  await page.goto('/test-sidebar')

  await expect(page.getByText('Teste do Sidebar Component')).toBeVisible()

  await page.getByRole('button', { name: 'Toggle menu' }).click()

  await expect(page.getByText('Mapa')).toBeVisible()
  await expect(page.getByText('Dashboard')).toBeVisible()
})
