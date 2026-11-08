/**
 * irrigationStore.ts
 *
 * Primary: Supabase irrigation_tasks + irrigation_events.
 * Fallback: localStorage.
 */
import { z } from 'zod'
import type { IrrigationTask, IrrigationEvent } from '../types'
import { generateId } from './farmStore'
import {
  dbGetTasks, dbCreateTask, dbUpdateTaskStatus, dbDeleteTask,
  dbGetEvents, dbSaveEvent,
} from '../lib/db/irrigation'
import { isDbAvailable } from '../lib/db/client'
import { dbGetCurrentUser } from '../lib/db/auth'

const TASKS_KEY  = 'agripulse_tasks'
const EVENTS_KEY = 'agripulse_events'

const TaskSchema = z.object({
  id:                     z.string(),
  farmId:                 z.string(),
  scheduledDate:          z.string(),
  estimatedVolumeLiters:  z.number().nonnegative(),
  notes:                  z.string(),
  status:                 z.enum(['pending','overdue','completed']),
  createdAt:              z.string(),
})

const EventSchema = z.object({
  id:                   z.string(),
  farmId:               z.string(),
  taskId:               z.string().optional(),
  date:                 z.string(),
  actualVolumeLiters:   z.number().nonnegative(),
  notes:                z.string(),
  recordedAt:           z.string(),
})

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGetTasks(): IrrigationTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (!raw) return []
    return z.array(TaskSchema).parse(JSON.parse(raw)) as IrrigationTask[]
  } catch { return [] }
}
function lsSaveTasks(tasks: IrrigationTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

function lsGetEvents(): IrrigationEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (!raw) return []
    return z.array(EventSchema).parse(JSON.parse(raw)) as IrrigationEvent[]
  } catch { return [] }
}
function lsSaveEvents(events: IrrigationEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function getTasks(): IrrigationTask[] {
  return lsGetTasks()
}

export function saveIrrigationTask(
  task: Omit<IrrigationTask, 'id' | 'createdAt' | 'status'>
): IrrigationTask {
  const newTask: IrrigationTask = {
    ...task,
    id:        generateId(),
    status:    'pending',
    createdAt: new Date().toISOString(),
  }
  const tasks = lsGetTasks()
  tasks.push(newTask)
  lsSaveTasks(tasks)

  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbCreateTask(newTask, user.id).catch(console.error)
    })
  }

  return newTask
}

export function updateTaskStatus(
  taskId: string,
  status: IrrigationTask['status']
): void {
  lsSaveTasks(lsGetTasks().map(t => t.id === taskId ? { ...t, status } : t))
  if (isDbAvailable()) dbUpdateTaskStatus(taskId, status).catch(console.error)
}

export function deleteTask(taskId: string): void {
  lsSaveTasks(lsGetTasks().filter(t => t.id !== taskId))
  if (isDbAvailable()) dbDeleteTask(taskId).catch(console.error)
}

// ── Events ────────────────────────────────────────────────────────────────────

export function getEvents(): IrrigationEvent[] {
  return lsGetEvents()
}

export function saveIrrigationEvent(
  event: Omit<IrrigationEvent, 'id' | 'recordedAt'>
): IrrigationEvent {
  const newEvent: IrrigationEvent = {
    ...event,
    id:         generateId(),
    recordedAt: new Date().toISOString(),
  }
  const events = lsGetEvents()
  events.push(newEvent)
  lsSaveEvents(events)

  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbSaveEvent(newEvent, user.id).catch(console.error)
    })
  }

  return newEvent
}

// ── DB sync ───────────────────────────────────────────────────────────────────

export async function syncIrrigationFromDb(): Promise<void> {
  if (!isDbAvailable()) return
  const user = await dbGetCurrentUser()
  if (!user) return
  try {
    const [dbTasks, dbEvents] = await Promise.all([
      dbGetTasks(user.id),
      dbGetEvents(user.id),
    ])
    if (dbTasks.length > 0)  lsSaveTasks(dbTasks)
    if (dbEvents.length > 0) lsSaveEvents(dbEvents)
  } catch (e) {
    console.warn('[irrigationStore] DB sync failed:', e)
  }
}
