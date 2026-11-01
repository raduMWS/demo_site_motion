/** Milestones reported to the inline loader in index.html (no-ops once it is gone). */
export type LoaderStep = 'app' | 'fonts' | 'scene' | 'frame' | 'chart'

declare global {
  interface Window {
    __loader?: { step: (s: LoaderStep) => void; finish: () => void }
  }
}

export const loaderStep = (s: LoaderStep) => window.__loader?.step(s)
export const loaderFinish = () => window.__loader?.finish()
