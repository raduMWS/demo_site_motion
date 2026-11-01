import { Component, type ReactNode } from 'react'
import { loaderFinish } from '../lib/loader'

/** Static chart image shown when WebGL is unavailable or the 3D scene fails for any reason. */
export function ChartFallback() {
  return <div className="voyage__fallback voyage__fallback--image" role="img" aria-label="Harta arhipelagului cu traseul bărcii" />
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Catches errors thrown while loading or rendering the 3D scene and swaps in the static chart. */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    loaderFinish()
    console.warn('[voyage] 3D scene unavailable, showing static chart instead.', err)
  }
  render() {
    return this.state.failed ? <ChartFallback /> : this.props.children
  }
}
