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

const cardCount = await page.locator('.card').count()
console.log('cards rendered:', cardCount)

// List view, top of page
await page.screenshot({ path: 'shots/01-list-top.png' })

// Select the first few matches to show selection state + bar
const cards = await page.locator('.card').all()
for (let i = 0; i < 3; i++) await cards[i].click()
await page.waitForTimeout(250)
await page.screenshot({ path: 'shots/02-list-selected.png' })

// Calendar view
await page.getByRole('button', { name: 'Calendar' }).click()
await page.waitForSelector('.cal-month', { timeout: 10000 })
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/03-calendar-top.png' })
await page.screenshot({ path: 'shots/04-calendar-full.png', fullPage: true })

// A single match card close-up (first card) back in list view
await page.getByRole('button', { name: 'List' }).click()
await page.waitForSelector('.card')
await page.locator('.card').first().screenshot({ path: 'shots/05-card-closeup.png' })

console.log('CONSOLE_ERRORS', JSON.stringify(errors, null, 2))
await browser.close()
