import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev-only hook so E2E tooling can exercise auth/pin-verification
// primitives directly (#23) before any screen actually calls them
// (the login screen is #24, dual sign-off's co-signer UI is #12).
// import.meta.env.DEV is statically false in a production build, so
// this branch — and the imports it would otherwise pull in — is
// dead-code-eliminated from what real users get; never present when
// testing against `vite build` + `vite preview` as later tickets do
// for anything that needs the real service worker.
if (import.meta.env.DEV) {
  Promise.all([import('./lib/pinVerification'), import('./lib/auth')]).then(
    ([{ verifyPin }, { completeLocalLogin }]) => {
      Object.assign(window, { __theobaseTest: { verifyPin, completeLocalLogin } })
    },
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
