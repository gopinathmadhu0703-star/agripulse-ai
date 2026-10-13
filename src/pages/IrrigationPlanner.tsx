import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Farm, IrrigationTask } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Dialog } from '../components/ui/Dialog'
import { Alert } from '../components/ui/Alert'
import { formatDate } from '../utils/formatters'

interface IrrigationPlannerProps {
  farms: Farm[]
  tasks: IrrigationTask[]
  onCreateTask: (task: Omit<IrrigationTask, 'id' | 'createdAt' | 'status'>) => void
  onCompleteTask: (taskId: string, actualVolume: number) => void
  onDeleteTask: (taskId: string) => void
}

type Tab = 'upcoming' | 'completed'

export function IrrigationPlanner({
  farms,
  tasks,
  onCreateTask,
  onCompleteTask,
  onDeleteTask,
}: IrrigationPlannerProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [showNewTask, setShowNewTask] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<IrrigationTask | undefined>()
  const [actualVolumeStr, setActualVolumeStr] = useState('')

  // New task form state
  const [farmId, setFarmId] = useState(farms[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [estVolume, setEstVolume] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | undefined>()

  const upcoming = tasks.filter((task) => task.status !== 'completed')
  const completed = tasks.filter((task) => task.status === 'completed')

  const TAB_LABELS: Record<Tab, string> = {
    upcoming: t('planner.status.pending'),
    completed: t('planner.status.completed'),
  }

  function handleCreateTask() {
    setFormError(undefined)
    const vol = parseFloat(estVolume)
    if (!farmId) { setFormError(t('farms.farmName') + ' is required'); return }
    if (!date) { setFormError(t('planner.scheduledDate') + ' is required'); return }
    if (isNaN(vol) || vol < 0) { setFormError(t('planner.estimatedVolume') + ' is invalid'); return }

    onCreateTask({ farmId, scheduledDate: date, estimatedVolumeLiters: vol, notes })
    setShowNewTask(false)
    setEstVolume('')
    setNotes('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  function handleCompleteConfirm() {
    if (!completeTarget) return
    const vol = parseFloat(actualVolumeStr)
    if (isNaN(vol) || vol < 0) return
    onCompleteTask(completeTarget.id, vol)
    setCompleteTarget(undefined)
    setActualVolumeStr('')
  }

  const tabData = tab === 'upcoming' ? upcoming : completed

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(['upcoming', 'completed'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === tabKey
                  ? 'bg-white shadow-sm text-stone-800'
                  : 'text-stone-500 hover:text-stone-700',
              ].join(' ')}
            >
              {TAB_LABELS[tabKey]} ({tabKey === 'upcoming' ? upcoming.length : completed.length})
            </button>
          ))}
        </div>
        {farms.length > 0 && (
          <Button size="sm" variant="primary" onClick={() => setShowNewTask(true)}>
            + {t('planner.addTask')}
          </Button>
        )}
      </div>

      {farms.length === 0 && (
        <Alert variant="info">{t('farms.noFarms')}</Alert>
      )}

      {tabData.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-stone-500">
            <p className="text-3xl mb-3" aria-hidden>{tab === 'upcoming' ? '📅' : '✅'}</p>
            <p className="font-medium text-stone-700 mb-1">{t('planner.noTasks')}</p>
            {tab === 'upcoming' && farms.length > 0 && (
              <Button size="sm" variant="primary" className="mt-3" onClick={() => setShowNewTask(true)}>
                {t('planner.addTask')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tabData.map((task) => {
            const farm = farms.find((f) => f.id === task.farmId)
            const isOverdue =
              task.status === 'pending' &&
              task.scheduledDate < new Date().toISOString().slice(0, 10)
            return (
              <Card key={task.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-stone-800">
                        {farm?.name ?? t('common.unknown')}
                      </p>
                      {task.status === 'completed' ? (
                        <Badge variant="success" size="sm">{t('planner.status.completed')}</Badge>
                      ) : isOverdue ? (
                        <Badge variant="danger" size="sm">{t('planner.status.overdue')}</Badge>
                      ) : (
                        <Badge variant="info" size="sm">{t('planner.status.pending')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">
                      📅 {formatDate(task.scheduledDate)} · ~{task.estimatedVolumeLiters.toLocaleString()} L
                    </p>
                    {task.notes && (
                      <p className="text-xs text-stone-400 mt-1">{task.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setCompleteTarget(task)
                          setActualVolumeStr(task.estimatedVolumeLiters.toString())
                        }}
                      >
                        {t('planner.markComplete')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* New task dialog */}
      <Dialog
        open={showNewTask}
        title={t('planner.addTask')}
        onClose={() => setShowNewTask(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowNewTask(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTask}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="warning">{formError}</Alert>}
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1">
              {t('farms.farmName')}
            </label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <Input
            label={t('planner.scheduledDate')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label={t('planner.estimatedVolume')}
            type="number"
            value={estVolume}
            onChange={(e) => setEstVolume(e.target.value)}
            min={0}
            placeholder="e.g. 5000"
          />
          <Input
            label={`${t('planner.notes')} (${t('common.optional')})`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. After morning check"
          />
        </div>
      </Dialog>

      {/* Mark complete dialog */}
      <Dialog
        open={!!completeTarget}
        title={t('planner.markComplete')}
        onClose={() => setCompleteTarget(undefined)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCompleteTarget(undefined)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCompleteConfirm}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-600">{t('history.volume')}:</p>
          <Input
            label={`${t('history.volume')} (L)`}
            type="number"
            value={actualVolumeStr}
            onChange={(e) => setActualVolumeStr(e.target.value)}
            min={0}
            required
          />
        </div>
      </Dialog>
    </div>
  )
}
