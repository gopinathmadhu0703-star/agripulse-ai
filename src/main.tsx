import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'   // must be imported before App so i18n is ready
import App from './App'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// Add error handling for development
try {
  createRoot(rootEl).render(
    <StrictMode>
      <Suspense fallback={<div className="min-h-screen bg-[#f8f9f4]" />}>
        <App />
      </Suspense>
    </StrictMode>
  )
  console.log('AgriPulse AI app mounted successfully')
} catch (error) {
  console.error('Failed to mount AgriPulse AI app:', error)
  
  // Show a simple error message in the UI
  rootEl.innerHTML = `
    <div style="padding: 2rem; font-family: Inter, sans-serif; text-align: center;">
      <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Application Error</h1>
      <p style="color: #4b5563; margin-bottom: 1.5rem;">
        AgriPulse AI failed to load. Please check the browser console for details.
      </p>
      <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; text-align: left; max-width: 600px; margin: 0 auto;">
        <p style="font-family: monospace; font-size: 0.875rem; color: #374151;">
          ${error instanceof Error ? error.message : String(error)}
        </p>
      </div>
      <button 
        onclick="location.reload()" 
        style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #059669; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500;">
        Reload Application
      </button>
    </div>
  `
}
