import { lazy, Suspense, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CHAPTERS } from '../config/chapters'
import { ISLANDS, ROUTE_POINTS } from '../config/route'
import { TIMELINE } from '../config/timeline'
import { clamp01, scrollToLength, waypointLengths, type Knot } from '../lib/routeMath'
import { useReducedMotion } from '../lib/useLayoutMode'
import { voyage } from '../lib/voyage'
import { ChapterNavigation } from './ChapterNavigation'
import { ChartFallback, SceneBoundary, hasWebGL } from './SceneBoundary'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** three.js is code-split: all copy renders before the 3D chunk arrives. */
const Scene = lazy(() => import('../three/Scene'))

const pad = (n: number) => String(n).padStart(2, '0')

function stopLengths() {
  const out: number[] = []
  waypointLengths(ROUTE_POINTS).forEach((l, i) => {
    const st = ROUTE_POINTS[i].stop
    if (st !== undefined) out[st] = l
  })
  return out
}

/**
 * The voyage spans the WHOLE page. The 3D scene is a fixed backdrop; every element marked
 * `data-stop="n"` anywhere in the document is a port of call. One ScrollTrigger maps document
 * scroll (top → bottom) to a single progress value that drives boat, camera, route and labels.
 * The boat docks at the arrival harbour exactly when the page reaches its end.
 */
export function SailingJourney() {
  const reduced = useReducedMotion()
  const [webgl] = useState(hasWebGL)
  const rootRef = useRef<HTMLDivElement>(null)
  const goToRef = useRef<(i: number) => void>((i) => document.querySelector(`[data-stop="${i}"]`)?.scrollIntoView())

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const navLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-nav]'))
      const count = root.querySelector<HTMLElement>('[data-count]')
      const railLabel = root.querySelector<HTMLElement>('[data-rail-label]')
      const lens = stopLengths()

      voyage.animated = !reduced
      voyage.len = 0
      voyage.s = 0
      voyage.shift = 1
      voyage.focusW = 0

      let activeIdx = -1
      const setActive = (i: number) => {
        if (i === activeIdx) return
        activeIdx = i
        navLinks.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')))
        if (count) count.textContent = pad(i)
        if (railLabel) railLabel.textContent = CHAPTERS[i].nav
        root.dataset.chapter = String(i)
      }

      if (reduced) {
        setActive(0)
        return
      }

      // ---- layout: where (in scroll px) each port of call sits --------------------------------
      let stopY: number[] = []
      let stopS: number[] = []
      let knots: Knot[] = []
      let max = 1
      const layout = () => {
        max = Math.max(1, ScrollTrigger.maxScroll(window))
        const vh = window.innerHeight
        const els = CHAPTERS.map((_, i) => document.querySelector<HTMLElement>(`[data-stop="${i}"]`))
        stopY = els.map((el, i) => {
          if (!el || i === 0) return 0
          if (i === CHAPTERS.length - 1) return max // arrive exactly at the end of the page
          const r = el.getBoundingClientRect()
          return Math.min(max, Math.max(0, r.top + window.scrollY + r.height / 2 - vh / 2))
        })
        stopS = stopY.map((y) => y / max)
        // dwell window around each stop (boat only drifts), travel in between
        const dwell = (TIMELINE.dwellVh * vh) / max
        knots = []
        stopS.forEach((s, i) => {
          const prevGap = i === 0 ? Infinity : s - stopS[i - 1]
          const nextGap = i === stopS.length - 1 ? Infinity : stopS[i + 1] - s
          const dA = i === 0 ? 0 : Math.min(dwell, prevGap * 0.3)
          const dB = i === stopS.length - 1 ? 0 : Math.min(dwell, nextGap * 0.3)
          knots.push({ s: s - dA, l: lens[i] - (i === 0 ? 0 : TIMELINE.drift) })
          knots.push({ s: s + dB, l: lens[i] + (i === stopS.length - 1 ? 0 : TIMELINE.drift) })
        })
      }

      const render = (s: number) => {
        voyage.s = s
        voyage.len = scrollToLength(s, knots)

        // nearest port of call → active chapter + camera framing
        let best = 0
        for (let i = 1; i < stopS.length; i++) if (s >= (stopS[i - 1] + stopS[i]) / 2) best = i
        setActive(best)
        const gap = Math.max(1e-3, ((stopS[best + 1] ?? 1) - (stopS[best - 1] ?? 0)) / 2)
        const near = 1 - clamp01(Math.abs(s - stopS[best]) / gap)
        const isl = ISLANDS.find((d) => d.id === CHAPTERS[best].island)
        if (isl) {
          voyage.focusX = isl.cx
          voyage.focusY = isl.cy
        }
        voyage.focusW = isl ? near : 0
        voyage.shift = CHAPTERS[best].side === 'left' ? 1 : -near
        // the boat-anatomy hint shows at the island chapters only (boat is close and large enough to tap)
        root.dataset.port = best >= 1 && best < CHAPTERS.length - 1 && near > 0.35 ? 'on' : 'off'

        // island labels light up as each island comes near
        document.querySelectorAll<HTMLElement>('.island-tag[data-island]').forEach((tag, k) => {
          const prev = stopS[k] ?? 0
          const at = stopS[k + 1] ?? 1
          const from = prev + (at - prev) * 0.35
          tag.style.opacity = (0.25 + 0.75 * clamp01((s - from) / ((at - from) * 0.8 || 1))).toFixed(3)
        })
        const h1 = document.querySelector<HTMLElement>('.island-tag[data-harbour="h1"]')
        const pre = stopS[stopS.length - 2] ?? 0
        if (h1) h1.style.opacity = (0.25 + 0.75 * clamp01((s - pre) / (1 - pre || 1))).toFixed(3)
      }

      layout()
      const state = { s: 0 }
      gsap.to(state, {
        s: 1,
        ease: 'none',
        onUpdate: () => render(state.s),
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: 'max',
          scrub: TIMELINE.scrub,
          invalidateOnRefresh: true,
        },
      })
      render(0)
      ScrollTrigger.addEventListener('refreshInit', layout)
      // labels mount with the lazy 3D chunk – re-apply once they exist
      const mo = new MutationObserver(() => render(state.s))
      mo.observe(root, { childList: true, subtree: true })
      const stopMo = setTimeout(() => mo.disconnect(), 8000)
      const onLoad = () => ScrollTrigger.refresh()
      window.addEventListener('load', onLoad, { once: true })
      document.fonts?.ready.then(onLoad)

      goToRef.current = (i) => window.scrollTo({ top: Math.round(stopY[i] ?? 0), behavior: 'smooth' })

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', layout)
        window.removeEventListener('load', onLoad)
        mo.disconnect()
        clearTimeout(stopMo)
      }
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef} className="voyage" data-reduced={reduced}>
      <div className="voyage__canvas">
        {webgl ? (
          <SceneBoundary>
            <Suspense fallback={<div className="voyage__fallback" />}>
              <Scene animated={!reduced} />
            </Suspense>
          </SceneBoundary>
        ) : (
          <ChartFallback />
        )}
      </div>
      <ChapterNavigation onSelect={(i) => goToRef.current(i)} />
    </div>
  )
}
