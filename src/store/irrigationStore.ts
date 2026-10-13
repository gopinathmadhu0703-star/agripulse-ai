import { z } from 'zod'
import type { IrrigationTask, IrrigationEvent } from '../types'
import { generateId } from './farmStore'

const TASKS_KEY = 'agripulse_tasks'
const EVENTS_KEY = 'agripulse_events'

const TaskSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  scheduledDate: z.string(),
  estimatedVolumeLiters: z.number().nonnegative(),
  notes: z.string(),
  status: z.enum(['pending', 'overdue', 'completed']),
  createdAt: z.string(),
})

const EventSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  taskId: z.string().optional(),
  date: z.string(),
  actualVolumeLiters: z.number().nonnegative(),
  notes: z.string(),
  recordedAt: z.string(),
})

export function getTasks(): IrrigationTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (!raw) return []
    return z.array(TaskSchema).parse(JSON.parse(raw)) as IrrigationTask[]
  } catch {
    return []
  }
}

export function saveIrrigationTask(
  task: Omit<IrrigationTask, 'id' | 'createdAt' | 'status'>
): IrrigationTask {
  const newTask: IrrigationTask = {
    ...task,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const tasks = getTasks()
  tasks.push(newTask)
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  return newTask
}

export function updateTaskStatus(
  taskId: string,
  status: IrrigationTask['status']
): void {
  const tasks = getTasks().map((t) =>
    t.id === taskId ? { ...t, status } : t
  )
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function deleteTask(taskId: string): void {
  const tasks = getTasks().filter((t) => t.id !== taskId)
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function getEvents(): IrrigationEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (!raw) return []
    return z.array(EventSchema).parse(JSON.parse(raw)) as IrrigationEvent[]
  } catch {
    return []
  }
}

export function saveIrrigationEvent(
  event: Omit<IrrigationEvent, 'id' | 'recordedAt'>
): IrrigationEvent {
  const newEvent: IrrigationEvent = {
    ...event,
    id: generateId(),
    recordedAt: new Date().toISOString(),
  }
  const events = getEvents()
  events.push(newEvent)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return newEvent
}
