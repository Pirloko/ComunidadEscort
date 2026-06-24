import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test('admin crea un dato en Datos de todo y queda visible de inmediato', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/resources')
  await page.getByRole('button', { name: 'Agregar dato' }).first().click()
  await page.waitForURL('**/resources/new')

  const name = `[PRUEBA] E2E admin ${Date.now()}`
  await page.getByLabel('Categoría').selectOption('farmacia')
  await page.getByLabel('Nombre del servicio').fill(name)
  await page.getByLabel('Descripción (opcional)').fill('Dato creado por test E2E, se borra al final del test.')
  await page.getByRole('button', { name: 'Agregar dato' }).click()

  await page.waitForURL(/\/resources\/[0-9a-f-]+$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(page.getByText('Farmacia', { exact: true })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Eliminar' }).click()
  await page.waitForURL('**/resources')
})
