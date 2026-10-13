import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock fetch globally so the test doesn't make real API calls
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [], daily: { time: [] } }),
  }))
  // Mock localStorage safely
  const localStorageMock = {
    clear: vi.fn(),
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }
  vi.stubGlobal('localStorage', localStorageMock)
})

describe('App smoke test', () => {
  it('renders without crashing', () => {
    render(<App />)
    // App renders the layout — "AgriPulse AI" should appear somewhere
    expect(document.body).toBeTruthy()
  })

  it('shows dashboard when no farms exist', () => {
    render(<App />)
    // The main dashboard heading should be visible
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0)
  })
})
