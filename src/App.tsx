import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { FarmManagement } from './pages/FarmManagement'
import { WeatherPage } from './pages/WeatherPage'
import { IrrigationAdvisor } from './pages/IrrigationAdvisor'
import { IrrigationPlanner } from './pages/IrrigationPlanner'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthCallback } from './pages/AuthCallback'
import { CommunityPage } from './pages/community/CommunityPage'
import { PostDetailPage } from './pages/community/PostDetailPage'
import { HelpPage } from './pages/HelpPage'
import type {
  Farm,
  WeatherForecast,
  RecommendationRecord,
  RecommendationResult,
  IrrigationInput,
  IrrigationTask,
  IrrigationEvent,
  AppSettings,
} from './types'
import {
  getFarms,
  saveFarm,
  deleteFarm,
  getActiveFarmId,
  setActiveFarmId,
} from './store/farmStore'
import {
  getTasks,
  saveIrrigationTask,
  updateTaskStatus,
  deleteTask,
  saveIrrigationEvent,
  getEvents,
} from './store/irrigationStore'
import {
  getRecommendations,
  saveRecommendation,
} from './store/historyStore'
import {
  getSettings,
  saveSettings,
  clearAllData,
} from './store/settingsStore'
import { fetchWeatherForecast } from './api/openMeteo'

function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [farms, setFarms] = useState<Farm[]>(() => getFarms())
  const [activeFarmId, setActiveFarmIdState] = useState<string | null>(() => getActiveFarmId())
  const [settings, setSettings] = useState<AppSettings>(() => getSettings())

  // Forecasts keyed by farmId
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({})
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastError, setForecastError] = useState<string | undefined>()

  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>(
    () => getRecommendations()
  )
  const [tasks, setTasks] = useState<IrrigationTask[]>(() => getTasks())
  const [events, setEvents] = useState<IrrigationEvent[]>(() => getEvents())

  const activeFarm = farms.find((f) => f.id === activeFarmId)
  const activeForecast = activeFarm ? forecasts[activeFarm.id] : undefined

  // ── Fetch forecast for active farm ────────────────────────────────────────
  const loadForecast = useCallback(async (farm: Farm) => {
    setForecastLoading(true)
    setForecastError(undefined)
    try {
      const forecast = await fetchWeatherForecast(farm.latitude, farm.longitude, 7)
      setForecasts((prev) => ({ ...prev, [farm.id]: forecast }))
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : 'Failed to load weather.')
    } finally {
      setForecastLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeFarm && !forecasts[activeFarm.id]) {
      void loadForecast(activeFarm)
    }
  }, [activeFarm, forecasts, loadForecast])

  // ── Farm handlers ──────────────────────────────────────────────────────────
  function handleSaveFarm(farm: Farm) {
    saveFarm(farm)
    setFarms(getFarms())
    // Auto-set as active if it's the first farm or a new farm
    if (farms.length === 0 || !activeFarmId) {
      setActiveFarmId(farm.id)
      setActiveFarmIdState(farm.id)
    }
  }

  function handleDeleteFarm(id: string) {
    deleteFarm(id)
    setFarms(getFarms())
    if (activeFarmId === id) {
      const remaining = getFarms()
      const next = remaining[0]?.id ?? null
      setActiveFarmIdState(next)
    }
  }

  function handleSetActiveFarm(id: string) {
    setActiveFarmId(id)
    setActiveFarmIdState(id)
  }

  // ── Recommendation handler ─────────────────────────────────────────────────
  function handleSaveRecommendation(
    result: RecommendationResult,
    input: IrrigationInput
  ) {
    if (!activeFarm) return
    saveRecommendation({
      farmId: activeFarm.id,
      farmName: activeFarm.name,
      recommendation: result,
      input,
    })
    setRecommendations(getRecommendations())
  }

  // ── Forecast handler (from advisor page) ──────────────────────────────────
  function handleForecastFetched(forecast: WeatherForecast) {
    if (!activeFarm) return
    setForecasts((prev) => ({ ...prev, [activeFarm.id]: forecast }))
  }

  // ── Task handlers ──────────────────────────────────────────────────────────
  function handleCreateTask(task: Omit<IrrigationTask, 'id' | 'createdAt' | 'status'>) {
    saveIrrigationTask(task)
    setTasks(getTasks())
  }

  function handleCompleteTask(taskId: string, actualVolume: number) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    updateTaskStatus(taskId, 'completed')
    saveIrrigationEvent({
      farmId: task.farmId,
      taskId,
      date: task.scheduledDate,
      actualVolumeLiters: actualVolume,
      notes: task.notes,
    })
    setTasks(getTasks())
    setEvents(getEvents())
  }

  function handleDeleteTask(taskId: string) {
    deleteTask(taskId)
    setTasks(getTasks())
  }

  // ── Settings handlers ──────────────────────────────────────────────────────
  function handleSaveSettings(partial: Partial<AppSettings>) {
    saveSettings(partial)
    setSettings(getSettings())
  }

  function handleResetAll() {
    clearAllData()
    setFarms([])
    setActiveFarmIdState(null)
    setForecasts({})
    setRecommendations([])
    setTasks([])
    setEvents([])
    setSettings(getSettings())
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />
          <Route
            path="/farms"
            element={
              <FarmManagement
                farms={farms}
                activeFarmId={activeFarmId}
                onSaveFarm={handleSaveFarm}
                onDeleteFarm={handleDeleteFarm}
                onSetActiveFarm={handleSetActiveFarm}
              />
            }
          />
          <Route
            path="/weather"
            element={
              <WeatherPage
                activeFarm={activeFarm}
                forecast={activeForecast}
                loading={forecastLoading}
                error={forecastError}
                onRefresh={() => activeFarm && loadForecast(activeFarm)}
                temperatureUnit={settings.temperatureUnit}
              />
            }
          />
          <Route
            path="/advisor"
            element={
              <IrrigationAdvisor
                activeFarm={activeFarm}
                onSaveRecommendation={handleSaveRecommendation}
                onForecastFetched={handleForecastFetched}
              />
            }
          />
          <Route
            path="/planner"
            element={
              <IrrigationPlanner
                farms={farms}
                tasks={tasks}
                onCreateTask={handleCreateTask}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
              />
            }
          />
          <Route
            path="/history"
            element={
              <HistoryPage
                recommendations={recommendations}
                events={events}
                farms={farms}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                settings={settings}
                onSave={handleSaveSettings}
                onResetAll={handleResetAll}
              />
            }
          />
          
          {/* OAuth Callback Route */}
          <Route
            path="/auth/callback"
            element={
              <AuthCallback />
            }
          />

          {/* Community Routes */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/post/:id" element={<PostDetailPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App