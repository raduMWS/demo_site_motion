import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/sora'
import '@fontsource-variable/commissioner'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/journey.css'
import './styles/sections.css'
import App from './App.tsx'
import { loaderStep } from './lib/loader'

// Start fetching the 3D chunk right away, in parallel with React booting.
// (React.lazy reuses this same request.)
import('./three/Scene').then(() => loaderStep('scene')).catch(() => {})
document.fonts?.ready.then(() => loaderStep('fonts'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
loaderStep('app')
