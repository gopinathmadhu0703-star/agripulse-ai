import { z } from 'zod'
import type { Farm } from '../types'

const FARMS_KEY = 'agripulse_farms'
const ACTIVE_FARM_KEY = 'agripulse_active_farm_id'

const FarmSchema = z.object({
  id: z.string(),
  name: z.string(),
  locationName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationDisplayName: z.string(),
  fieldAreaHa: z.number().positive(),
  crop: z.enum(['wheat', 'maize', 'rice', 'tomato', 'potato', 'soybean', 'cotton', 'sugarcane']),
  growthStage: z.enum(['initial', 'mid', 'end']),
  soilType: z.enum(['sandy', 'loamy', 'clay', 'silty']),
  irrigationMethod: z.enum(['drip', 'sprinkler', 'furrow', 'flood']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function getFarms(): Farm[] {
  try {
    const raw = localStorage.getItem(FARMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return z.array(FarmSchema).parse(parsed) as Farm[]
  } catch {
    return []
  }
}

export function getFarmById(id: string): Farm | undefined {
  return getFarms().find((f) => f.id === id)
}

export function saveFarm(farm: Farm): void {
  const farms = getFarms()
  const idx = farms.findIndex((f) => f.id === farm.id)
  if (idx >= 0) {
    farms[idx] = farm
  } else {
    farms.push(farm)
  }
  localStorage.setItem(FARMS_KEY, JSON.stringify(farms))
}

export function deleteFarm(id: string): void {
  const farms = getFarms().filter((f) => f.id !== id)
  localStorage.setItem(FARMS_KEY, JSON.stringify(farms))
  if (getActiveFarmId() === id) {
    localStorage.removeItem(ACTIVE_FARM_KEY)
  }
}

export function getActiveFarmId(): string | null {
  return localStorage.getItem(ACTIVE_FARM_KEY)
}

export function setActiveFarmId(id: string): void {
  localStorage.setItem(ACTIVE_FARM_KEY, id)
}

export function getActiveFarm(): Farm | undefined {
  const id = getActiveFarmId()
  if (!id) return undefined
  return getFarmById(id)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
