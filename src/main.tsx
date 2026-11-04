import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { AuthorizeProvider } from './providers/AuthorizeProvider'
import { LanguageProvider } from './providers/LanguageProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthorizeProvider>
        <App />
      </AuthorizeProvider>
    </LanguageProvider>
  </StrictMode>,
)
