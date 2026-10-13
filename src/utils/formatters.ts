import type { TemperatureUnit } from '../types'

export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  if (unit === 'fahrenheit') {
    const f = (celsius * 9) / 5 + 32
    return `${f.toFixed(1)}°F`
  }
  return `${celsius.toFixed(1)}°C`
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatVolume(litres: number): string {
  if (litres >= 1_000_000) return `${(litres / 1_000_000).toFixed(2)} ML`
  if (litres >= 1_000) return `${(litres / 1_000).toFixed(1)} kL`
  return `${litres.toLocaleString()} L`
}

export function formatMm(mm: number): string {
  return `${mm.toFixed(1)} mm`
}

export function timeAgo(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffH / 24)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffD === 1) return 'Yesterday'
  return `${diffD} days ago`
}
