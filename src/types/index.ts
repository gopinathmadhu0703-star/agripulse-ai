// ─────────────────────────────────────────────
// AgriPulse AI — Shared TypeScript Domain Types
// ─────────────────────────────────────────────

// ── Geographic ──────────────────────────────────────────────────────────────

export interface GeoLocation {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
  timezone: string
  displayName: string // "{name}, {admin1}, {country}"
}

// ── Weather ──────────────────────────────────────────────────────────────────

export interface HourlyWeather {
  time: string[]                    // ISO datetime strings
  et0_fao_evapotranspiration: number[] // mm/hr (FAO-56 Penman-Monteith)
  precipitation: number[]           // mm/hr total precipitation
  precipitation_probability: number[] // %
  temperature_2m: number[]          // °C
  wind_speed_10m: number[]          // km/h
  weather_code: number[]            // WMO codes
}

export interface DailyWeather {
  date: string                     // YYYY-MM-DD
  et0Mm: number                    // mm/day  — sum of hourly
  precipitationMm: number          // mm/day  — sum of hourly
  precipProbabilityMax: number     // %       — max of hourly
  tempMaxC: number                 // °C
  tempMinC: number                 // °C
  windSpeedAvgKmh: number          // km/h    — average of hourly
  dominantWeatherCode: number      // WMO code — most common in day
}

export interface WeatherForecast {
  latitude: number
  longitude: number
  timezone: string
  daily: DailyWeather[]            // 7 days
  fetchedAt: string                // ISO timestamp of fetch
}

// ── Farm ─────────────────────────────────────────────────────────────────────

export type SoilType = 'sandy' | 'loamy' | 'clay' | 'silty'
export type IrrigationMethod = 'drip' | 'sprinkler' | 'furrow' | 'flood'

export type CropType =
  | 'wheat'
  | 'maize'
  | 'rice'
  | 'tomato'
  | 'potato'
  | 'soybean'
  | 'cotton'
  | 'sugarcane'

export type GrowthStage = 'initial' | 'mid' | 'end'

export interface Farm {
  id: string                       // UUID
  name: string
  locationName: string             // User-entered text
  latitude: number
  longitude: number
  locationDisplayName: string
  fieldAreaHa: number              // hectares
  crop: CropType
  growthStage: GrowthStage
  soilType: SoilType
  irrigationMethod: IrrigationMethod
  createdAt: string                // ISO
  updatedAt: string                // ISO
}

// ── Irrigation Engine Inputs / Outputs ───────────────────────────────────────

/**
 * Soil moisture is entered as Volumetric Water Content (VWC%) —
 * the percentage of soil volume occupied by water.
 * θ (m³/m³) = soilMoistureVwcPct / 100
 * This is NOT a sensor reading. It is a manual field estimate.
 */
export interface IrrigationInput {
  farm: Farm
  soilMoistureVwcPct?: number      // 0–100 — manual VWC estimate; undefined = unknown
  soilReadingAgeHours?: number     // hours since last estimate was made
  horizonDays: 1 | 2 | 3          // forecast horizon for demand calculation
}

export interface FormulaStep {
  label: string                    // e.g. "Crop Evapotranspiration (ETc)"
  formulaStr: string               // e.g. "ETc = ET₀ × Kc"
  substitution: string             // e.g. "= 4.2 mm/day × 1.20"
  result: number
  unit: string
}

export interface RecommendationResult {
  action: 'irrigate' | 'wait' | 'collect-reading'
  et0DailyMm: number               // mm/day
  kcUsed: number                   // dimensionless
  etcDailyMm: number               // mm/day
  effectiveRainMm: number          // mm over horizon
  soilBufferMm: number             // mm of available water in root zone
  netDemandMm: number              // mm over horizon (may be negative)
  irrigationVolumeLiters: number   // litres (0 if no irrigation needed)
  formulaTrace: FormulaStep[]
  assumptions: string[]
  warnings: string[]
  generatedAt: string              // ISO
}

// ── Irrigation Planner ───────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'overdue' | 'completed'

export interface IrrigationTask {
  id: string
  farmId: string
  scheduledDate: string            // YYYY-MM-DD
  estimatedVolumeLiters: number
  notes: string
  status: TaskStatus
  createdAt: string
}

export interface IrrigationEvent {
  id: string
  farmId: string
  taskId?: string                  // linked task if created from planner
  date: string                     // YYYY-MM-DD
  actualVolumeLiters: number
  notes: string
  recordedAt: string               // ISO
}

// ── History ──────────────────────────────────────────────────────────────────

export interface RecommendationRecord {
  id: string
  farmId: string
  farmName: string
  recommendation: RecommendationResult
  input: IrrigationInput
  createdAt: string                // ISO
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = 'rain-alert' | 'stale-reading' | 'task-due' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  farmId?: string
  createdAt: string
  dismissed: boolean
}

// ── Settings ─────────────────────────────────────────────────────────────────

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface AppSettings {
  temperatureUnit: TemperatureUnit
  defaultHorizonDays: 1 | 2 | 3
  notificationsEnabled: {
    rainAlert: boolean
    staleReading: boolean
    taskDue: boolean
  }
  onboardingCompleted: boolean
  dismissedNotificationIds: string[]
}

// ── User / Authentication ───────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  picture?: string
  locale?: string
  emailVerified: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// ── Community ─────────────────────────────────────────────────────────────────

export type PostLanguage = 'en' | 'ta' | 'hi'
export type PostTag = 'demo' | 'self-reported' | 'verified'

export interface FarmerProfile {
  userId: string
  displayName: string
  preferredLanguage: PostLanguage
  district: string
  village: string
  interests: string[]          // crop names they grow
  createdAt: string
}

export interface IrrigationExperience {
  // Crop
  crop: CropType
  variety?: string
  // Location
  district: string
  village: string
  hideExactLocation: boolean
  // Farm
  soilType: SoilType
  farmAreaHa: number
  // Crop timing
  growthStage: GrowthStage
  cultivationStart: string     // YYYY-MM-DD
  cultivationEnd?: string      // YYYY-MM-DD
  // Irrigation
  irrigationMethod: IrrigationMethod
  irrigationDates: string[]    // YYYY-MM-DD array
  sessions: number
  durationPerSessionMin?: number
  waterPerSessionLiters?: number
  // Observations
  rainfallObservations?: string
  soilMoistureObservations?: string
  observations: string         // required
}

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string           // display name at time of posting
  language: PostLanguage
  tag: PostTag
  experience: IrrigationExperience
  helpfulVotes: number
  votedByUserIds: string[]     // for dedup — empty in localStorage demo
  commentCount: number
  reported: boolean
  createdAt: string
  updatedAt: string
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  text: string
  language: PostLanguage
  createdAt: string
}

export interface CommunityGroup {
  id: string
  name: string
  district: string
  crop?: CropType
  season?: string
  memberCount: number
  description: string
}

export interface CommunityFilters {
  crop?: CropType | ''
  district?: string
  stage?: GrowthStage | ''
  season?: string
  search?: string
}
