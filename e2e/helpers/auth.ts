import type { Page } from '@playwright/test'

async function login(page: Page, identifier: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email o celular').fill(identifier)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
}

export async function loginAsAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en .env.e2e.local')
  }
  await login(page, email, password)
}

export async function loginAsUser(page: Page) {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  if (!email || !password) {
    throw new Error('Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en .env.e2e.local')
  }
  await login(page, email, password)
}

export async function logout(page: Page) {
  await page.locator('header').getByRole('button', { expanded: false }).click()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login', { timeout: 15_000 })
}
