import { test, expect } from '@playwright/test'

test.describe('Mobile UI - Admin & operador', () => {
  test('Admin Map mobile: sidebar toggle, filters and playback', async ({ page }) => {
    await page.goto('/admin/mapa')

    await expect(page.getByText('Mapa da Frota')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Ao vivo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Histórico' })).toBeVisible()

    await page.getByRole('button', { name: 'Histórico' }).click()

    await expect(page.getByRole('button', { name: '1×' })).toBeVisible()
    await expect(page.getByRole('button', { name: '2×' })).toBeVisible()
    await expect(page.getByRole('button', { name: '4×' })).toBeVisible()

    await page.getByRole('button', { name: 'Toggle menu' }).click()

    await expect(page.getByText('Mapa')).toBeVisible()
  })

  test('operador mobile: KPI cards and period filter interactions', async ({ page }) => {
    await page.goto('/operador')

    await expect(page.getByText('Painel do Operador')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Hoje' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Semana' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mês' })).toBeVisible()

    await page.getByRole('button', { name: 'Semana' }).click()

    await expect(page.getByText('KPIs do Dia')).toBeVisible()
  })
})
