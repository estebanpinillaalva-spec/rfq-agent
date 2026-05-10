import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
]

function findChrome() {
  const found = CHROME_CANDIDATES.find(p => p && existsSync(p))
  if (!found) throw new Error('Chrome not found')
  return found
}

const pages = [
  { url: 'http://localhost:3099/dashboard',          name: '01-dashboard' },
  { url: 'http://localhost:3099/dashboard/rfqs',      name: '02-rfqs' },
  { url: 'http://localhost:3099/dashboard/email',     name: '03-email' },
  { url: 'http://localhost:3099/dashboard/settings',  name: '04-settings' },
]

await mkdir('qa-screenshots', { recursive: true })

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--window-size=1400,900'],
  defaultViewport: { width: 1400, height: 900 },
})

for (const { url, name } of pages) {
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {
    console.log(`Could not load ${url} — server may not be ready`)
  })
  await page.screenshot({ path: `qa-screenshots/${name}.png`, fullPage: false })
  console.log(`Captured ${name}.png`)
  await page.close()
}

await browser.close()
console.log('Done. See qa-screenshots/')
