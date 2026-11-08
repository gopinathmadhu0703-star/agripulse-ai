import { supabase, isDbAvailable, dbError } from './client'
import { isValidUuid, ensureUuid } from './farms'
import type { IrrigationTask, IrrigationEvent } from '../../types'

// ── Tasks ─────────────────────────────────────────────────────────────────────

function rowToTask(r: Record<string, unknown>): IrrigationTask {
  return {
    id:                     r.id as string,
    farmId:                 r.farm_id as string,
    scheduledDate:          r.scheduled_date as string,
    estimatedVolumeLiters:  Number(r.estimated_volume_liters),
    notes:                  (r.notes as string) ?? '',
    status:                 r.status as IrrigationTask['status'],
    createdAt:              r.created_at as string,
  }
}

export async function dbGetTasks(userId: string): Promise<IrrigationTask[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('irrigation_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true })
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToTask)
}

export async function dbCreateTask(
  task: Omit<IrrigationTask, 'createdAt' | 'status'> & { id?: string; status?: IrrigationTask['status'] },
  userId: string
): Promise<IrrigationTask> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  if (!isValidUuid(task.farmId)) {
    throw dbError('Invalid farm ID format. Irrigation tasks require a valid database farm UUID.')
  }

  const taskId = ensureUuid(task.id)
  const { data, error } = await supabase!
    .from('irrigation_tasks')
    .insert({
      id:                      taskId,
      user_id:                 userId,
      farm_id:                 task.farmId,
      scheduled_date:          task.scheduledDate,
      estimated_volume_liters: Math.max(0, Number(task.estimatedVolumeLiters)),
      notes:                   task.notes ?? '',
      status:                  task.status ?? 'pending',
    })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToTask(data)
}

export async function dbUpdateTaskStatus(
  taskId: string,
  status: IrrigationTask['status']
): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { error } = await supabase!
    .from('irrigation_tasks')
    .update({ status })
    .eq('id', taskId)
  if (error) throw dbError(error.message)
}

export async function dbDeleteTask(taskId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { error } = await supabase!.from('irrigation_tasks').delete().eq('id', taskId)
  if (error) throw dbError(error.message)
}

// ── Events ────────────────────────────────────────────────────────────────────

function rowToEvent(r: Record<string, unknown>): IrrigationEvent {
  return {
    id:                   r.id as string,
    farmId:               r.farm_id as string,
    taskId:               (r.task_id as string | null) ?? undefined,
    date:                 r.event_date as string,
    actualVolumeLiters:   Number(r.actual_volume_liters),
    notes:                (r.notes as string) ?? '',
    recordedAt:           r.recorded_at as string,
  }
}

export async function dbGetEvents(userId: string): Promise<IrrigationEvent[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('irrigation_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false })
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToEvent)
}

export async function dbSaveEvent(
  event: Omit<IrrigationEvent, 'recordedAt'> & { id?: string },
  userId: string
): Promise<IrrigationEvent> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  if (!isValidUuid(event.farmId)) {
    throw dbError('Invalid farm ID format. Irrigation events require a valid database farm UUID.')
  }

  const eventId = ensureUuid(event.id)
  const taskId = event.taskId && isValidUuid(event.taskId) ? event.taskId : null

  const { data, error } = await supabase!
    .from('irrigation_events')
    .insert({
      id:                    eventId,
      user_id:               userId,
      farm_id:               event.farmId,
      task_id:               taskId,
      event_date:            event.date,
      actual_volume_liters:  Math.max(0, Number(event.actualVolumeLiters)),
      notes:                 event.notes ?? '',
    })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToEvent(data)
}

export async function dbDeleteEvent(eventId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { error } = await supabase!.from('irrigation_events').delete().eq('id', eventId)
  if (error) throw dbError(error.message)
}
