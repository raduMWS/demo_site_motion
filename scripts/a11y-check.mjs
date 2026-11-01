// WCAG 2.1 AA audit with axe-core, in WebKit (desktop + iPhone). Run: npm run check:a11y (with `npm run preview` running)
import { webkit, devices } from 'playwright'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')
const url = process.env.URL || 'http://localhost:4173/'
const browser = await webkit.launch()
let failed = 0
for (const [name, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['iphone', devices['iPhone 14']]]) {
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  await page.goto(url)
  await page.waitForTimeout(3500)
  await page.addScriptTag({ path: axePath })
  const v = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })
    return r.violations.map((x) => `${x.impact}: ${x.id} – ${x.help} (${x.nodes.length})`)
  })
  console.log(`${name}: ${v.length ? v.join('\n  ') : 'no violations'}`)
  failed += v.length
  await ctx.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
