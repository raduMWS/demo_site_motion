// Safari engine smoke test: iPhone 14 + desktop Safari. Run: node scripts/webkit-check.mjs [outDir]
import { webkit, devices } from 'playwright'
const out = process.argv[2] || '.'
const url = process.env.URL || 'http://localhost:4173/'
const browser = await webkit.launch()
const results = {}
for (const [name, opts] of [['iphone', devices['iPhone 14']], ['desktop-safari', { viewport: { width: 1440, height: 900 } }]]) {
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url)
  await page.waitForTimeout(5000)
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'))
    return {
      canvas: !!c,
      webgl2: !!(c && c.getContext('webgl2')),
      fallback: !!document.querySelector('.voyage__fallback--image'),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      fontsOk: document.fonts.check('16px "Sora Variable"') && document.fonts.check('16px "Commissioner Variable"'),
      gl: !!gl,
    }
  })
  await page.screenshot({ path: `${out}/${name}-0-hero.png` })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('la-carma').scrollIntoView() })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${out}/${name}-1-chapter.png` })
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(3000)
  const rail = await page.evaluate(() => document.querySelector('[data-rail-label]')?.textContent)
  await page.screenshot({ path: `${out}/${name}-2-end.png` })
  results[name] = { ...info, railAtEnd: rail, errors }
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(results, null, 2))
