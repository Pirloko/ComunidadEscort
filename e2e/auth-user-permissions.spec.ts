import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsUser, logout } from './helpers/auth'

test('usuario regular no ve botones de creación y no puede entrar a /resources/new por URL', async ({
  page,
}) => {
  await loginAsUser(page)

  await page.goto('/resources')
  await expect(page.getByRole('button', { name: 'Agregar dato' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Mis datos' })).not.toBeVisible()

  await page.goto('/resources/new')
  await page.waitForURL((url) => !url.pathname.startsWith('/resources/new'), { timeout: 15_000 })
  expect(page.url()).not.toContain('/resources/new')
})

test('usuario regular puede comentar y dejar reseña en un dato existente', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/resources')
  await page.getByRole('button', { name: 'Agregar dato' }).first().click()
  await page.waitForURL('**/resources/new')

  const name = `[PRUEBA] E2E permisos usuario ${Date.now()}`
  await page.getByLabel('Categoría').selectOption('otros')
  await page.getByLabel('Nombre del servicio').fill(name)
  await page.getByRole('button', { name: 'Agregar dato' }).click()
  await page.waitForURL(/\/resources\/[0-9a-f-]+$/, { timeout: 15_000 })
  const resourceUrl = page.url()

  await logout(page)
  await loginAsUser(page)

  await page.goto(resourceUrl)
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Eliminar' })).not.toBeVisible()

  await page.getByPlaceholder('Escribe un comentario...').fill('Comentario de prueba E2E')
  await page.getByRole('button', { name: 'Comentar' }).click()
  await expect(page.getByText('Comentario de prueba E2E')).toBeVisible()

  await page.getByRole('button', { name: '5 estrellas' }).click()
  await page.getByPlaceholder('Cuéntanos tu experiencia (opcional)').fill('Reseña de prueba E2E')
  await page.getByRole('button', { name: 'Publicar reseña' }).click()
  await expect(page.getByText('Reseña de prueba E2E')).toBeVisible()
  await expect(page.getByText(/^5(\.0)? \(1 reseña\)$/)).toBeVisible()

  await logout(page)
  await loginAsAdmin(page)
  await page.goto(resourceUrl)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Eliminar' }).click()
  await page.waitForURL('**/resources')
})
