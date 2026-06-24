import { test, expect } from '@playwright/test'
import { loginAsUser } from './helpers/auth'

test('campana de notificaciones → Ver todas → /notifications renderiza sin pantalla blanca', async ({
  page,
}) => {
  await loginAsUser(page)

  await page.getByRole('button', { name: 'Notificaciones' }).click()
  await expect(page.getByText('Notificaciones', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Ver todas' }).click()

  await page.waitForURL('**/notifications')
  await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible()
  // La pantalla blanca reportada habría disparado el ErrorBoundary; confirmamos que no aparece.
  await expect(page.getByText('Algo salió mal')).not.toBeVisible()
})
