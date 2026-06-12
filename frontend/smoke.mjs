import { chromium } from 'playwright'

const base = 'http://localhost:5173'
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1320, height: 1000 },
  deviceScaleFactor: 2,
})

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.card', { timeout: 20000 })
console.log('cards rendered:', await page.locator('.card').count())

async function setTheme(name) {
  await page.getByRole('button', { name }).click()
  await page.waitForTimeout(350)
}

// List view in each theme
await page.screenshot({ path: 'shots/theme-heritage.png' })
await setTheme('Floodlight theme')
await page.screenshot({ path: 'shots/theme-floodlight.png' })
await setTheme('Pop theme')
await page.screenshot({ path: 'shots/theme-pop.png' })

// Calendar in the Pop theme
await page.getByRole('button', { name: 'Calendar' }).click()
await page.waitForSelector('.cal-month')
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/theme-pop-calendar.png' })

// Filtered list (Heritage) — pick a team
await setTheme('Heritage theme')
await page.getByRole('button', { name: 'List' }).click()
await page.waitForSelector('.card')
const teamSelect = page.locator('.filter-field', { hasText: 'Team' }).locator('select')
await teamSelect.selectOption({ label: 'Brazil' })
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/filtered-brazil.png' })

console.log('CONSOLE_ERRORS', JSON.stringify(errors, null, 2))
await browser.close()
