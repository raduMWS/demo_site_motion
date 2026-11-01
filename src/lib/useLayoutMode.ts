import { useEffect, useState } from 'react'

const REDUCE = '(prefers-reduced-motion: reduce)'

/** true when the visitor asked for reduced motion → still 3D overview, no travel. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCE).matches)
  useEffect(() => {
    const q = window.matchMedia(REDUCE)
    const on = () => setReduced(q.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return reduced
}
