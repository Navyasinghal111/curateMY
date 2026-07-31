import { expect, test } from '@playwright/test'

test('public storefront keeps its navigation and products usable', async ({ page }) => {
  await page.goto('/navya', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.storefront-header')).toBeVisible()
  await expect(page.locator('.tab-bar')).toBeVisible()

  const cards = page.locator('.card')
  await expect(cards.first()).toBeVisible()

  const firstProductLink = cards.first().locator('.card-detail-link')
  await expect(firstProductLink).toHaveAttribute('href', /\/product\//)
})

test('category rail remains pinned while scrolling through a storefront', async ({ page }) => {
  await page.goto('/navya', { waitUntil: 'domcontentloaded' })

  const categoryRail = page.locator('.category-sticky')
  await expect(categoryRail).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

  await expect.poll(async () => categoryRail.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBeLessThanOrEqual(128)
})

test('mobile storefront remains a two-column product grid', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This layout assertion applies only to the mobile project.')
  await page.goto('/navya', { waitUntil: 'domcontentloaded' })

  const grid = page.locator('.grid')
  await expect(grid).toBeVisible()
  await expect.poll(async () => grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
})
