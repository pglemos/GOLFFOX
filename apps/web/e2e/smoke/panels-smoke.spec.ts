import { test, expect, type Page } from '@playwright/test'

type Credentials = { email: string; password: string }

async function login(page: Page, credentials: Credentials) {
  await page.goto('/')
  await page.fill('input[type="email"]:visible', credentials.email)
  await page.fill('input[type="password"]:visible', credentials.password)
  await page.locator('button:has-text("Entrar"):visible').click()
}

function trackPageErrors(page: Page) {
  const pageErrors: string[] = []
  page.on('pageerror', (err: Error) => {
    pageErrors.push(err.message)
  })
  return pageErrors
}

test.describe.serial('Smoke - 3 paineis', () => {
  test.setTimeout(120_000)

  test('Admin - carrega painel e KPIs', async ({ page }) => {
    const pageErrors = trackPageErrors(page)

    await login(page, { email: 'golffox@admin.com', password: 'senha123' })
    await expect(page).toHaveURL(/\/admin/, { timeout: 60_000 })
    await expect(page.getByText('Filtros', { exact: true })).toBeVisible({ timeout: 60_000 })

    expect(pageErrors).toEqual([])
  })

  test('Transportadora - carrega painel', async ({ page }) => {
    const pageErrors = trackPageErrors(page)

    await login(page, { email: 'teste@transportadora.com', password: 'senha123' })
    await expect(page).toHaveURL(/\/transportadora/, { timeout: 60_000 })
    await expect(page.locator('h1')).toContainText('Frota', { timeout: 60_000 })

    expect(pageErrors).toEqual([])
  })

  test('Empresa - carrega painel e indicadores', async ({ page }) => {
    const pageErrors = trackPageErrors(page)

    await login(page, { email: 'teste@empresa.com', password: 'senha123' })
    await expect(page).toHaveURL(/\/empresa/, { timeout: 60_000 })
    await expect(page.getByText('Indicadores de Performance', { exact: true })).toBeVisible({ timeout: 60_000 })

    expect(pageErrors).toEqual([])
  })
})
