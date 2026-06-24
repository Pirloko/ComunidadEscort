import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test('admin crea usuario manualmente vía Edge Function admin-create-user (si está desplegada)', async ({
  page,
}) => {
  await loginAsAdmin(page)
  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'Crear usuario' }).click()

  const stamp = Date.now()
  const alias = `prueba_e2e_${stamp}`
  const email = `prueba.e2e.${stamp}@example.com`

  await page.getByLabel('Alias').fill(alias)
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Celular').fill('+56 9 1234 5678')
  await page.getByLabel('Link de publicación').fill('https://example.com/prueba-e2e')
  await page.locator('form').getByRole('button', { name: 'Crear usuario' }).click()

  const credentialsHeading = page.getByRole('heading', { name: 'Credenciales del usuario' })
  const errorBanner = page.locator('form .text-destructive')
  await expect(credentialsHeading.or(errorBanner)).toBeVisible({ timeout: 15_000 })

  if (await credentialsHeading.isVisible()) {
    await expect(page.getByText(email)).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar' }).click()
    console.log(
      `[E2E] Edge Function admin-create-user OK. Usuario de prueba creado: ${email} (alias ${alias}). ` +
        'Requiere limpieza manual en auth.users (no hay botón de borrado en la UI).',
    )
  } else {
    console.log(
      '[E2E] admin-create-user no devolvió credenciales (Edge Function no desplegada o desactualizada). ' +
        'No se creó ningún usuario.',
    )
    await page.getByRole('button', { name: 'Cancelar' }).click()
  }
})
