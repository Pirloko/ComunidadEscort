import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

const ERROR_MESSAGE = 'Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)'

test('formulario de registro valida celular chileno en tiempo real (onBlur)', async ({ page }) => {
  await page.goto('/register')

  const phoneInput = page.getByLabel('Celular')
  await phoneInput.fill('123')
  await phoneInput.blur()
  await expect(page.getByText(ERROR_MESSAGE)).toBeVisible()

  await phoneInput.fill('+56 9 1234 5678')
  await phoneInput.blur()
  await expect(page.getByText(ERROR_MESSAGE)).not.toBeVisible()
})

test('modal "Crear usuario" del admin valida celular chileno en tiempo real (onBlur)', async ({
  page,
}) => {
  await loginAsAdmin(page)

  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'Crear usuario' }).click()

  const phoneInput = page.getByLabel('Celular')
  await phoneInput.fill('123')
  await phoneInput.blur()
  await expect(page.getByText(ERROR_MESSAGE)).toBeVisible()

  await phoneInput.fill('+56 9 1234 5678')
  await phoneInput.blur()
  await expect(page.getByText(ERROR_MESSAGE)).not.toBeVisible()

  await page.getByRole('button', { name: 'Cancelar' }).click()
})
