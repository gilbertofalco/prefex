import { test, expect } from '@playwright/test'

test.describe('RITA Demo Mode', () => {
  test('student can login and see dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Preencher Aluno' }).click()
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Escolha uma atividade')).toBeVisible()
    await expect(page.getByText('Matriz de Círculos')).toBeVisible()
  })

  test('professional can login and see panel', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Profissional', exact: true }).click()
    await page.getByRole('button', { name: 'Preencher Profissional' }).click()
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Painel Profissional')).toBeVisible()
  })

  test('student can open visuomotor game', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Preencher Aluno' }).click()
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('button', { name: /Matriz de Círculos/i }).click()
    await expect(page.getByText('Replique o padrão')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Concluir' })).toBeVisible()
  })
})
