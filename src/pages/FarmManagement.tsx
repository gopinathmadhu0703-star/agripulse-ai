import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/DashboardLayout'
import { Sprout, MapPin, Ruler, Droplets, Pencil, Trash2, Plus, Radio } from 'lucide-react'
import type { Farm } from '../types'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import { FarmForm } from '../components/FarmForm'
import { getCropLabel } from '../data/cropCoefficients'

interface FarmManagementProps {
  farms: Farm[]
  activeFarmId: string | null
  onSaveFarm: (farm: Farm) => void
  onDeleteFarm: (id: string) => void
  onSetActiveFarm: (id: string) => void
}

export function FarmManagement({
  farms,
  activeFarmId,
  onSaveFarm,
  onDeleteFarm,
  onSetActiveFarm,
}: FarmManagementProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingFarm, setEditingFarm] = useState<Farm | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Farm | undefined>()

  function handleSave(farm: Farm) {
    onSaveFarm(farm)
    setMode('list')
    setEditingFarm(undefined)
  }

  function handleEdit(farm: Farm) {
    setEditingFarm(farm)
    setMode('edit')
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      onDeleteFarm(deleteTarget.id)
      setDeleteTarget(undefined)
    }
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <DashboardLayout
        title={mode === 'add' ? t('farms.addFarm') : `${t('farms.editFarm')}: ${editingFarm?.name}`}
        subtitle={t('farms.subtitle')}
      >
        <div className="max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMode('list'); setEditingFarm(undefined) }}
            className="mb-5"
          >
            ← {t('common.back')}
          </Button>
          <div className="bg-white border border-[#E0E5DD] rounded-lg p-6">
            <FarmForm
              initial={editingFarm}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setEditingFarm(undefined) }}
            />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={t('farms.title')}
      subtitle={t('farms.subtitle')}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#202820]">
              {farms.length} {farms.length !== 1 ? t('nav.farms').toLowerCase() : t('nav.farms').toLowerCase().replace(/s$/, '')}
            </h3>
            <p className="text-sm text-[#687168] mt-1">{t('farms.setActive')}</p>
          </div>
          <Button
            onClick={() => setMode('add')}
            size="md"
          >
            <Plus size={14} /> {t('farms.addFarm')}
          </Button>
        </div>

        {/* Farm list or empty state */}
        {farms.length === 0 ? (
          <div className="bg-white border border-[#E0E5DD] rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EAF0E6] flex items-center justify-center">
              <Sprout size={24} className="text-[#527A45]" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">{t('farms.noFarms')}</h3>
            <p className="text-sm text-[#9AA49A] mb-5">{t('farms.subtitle')}</p>
            <Button onClick={() => setMode('add')}>
              <Plus size={14} /> {t('farms.addFarm')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white border border-[#E0E5DD] rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-[#202820]">{farm.name}</h3>
                      {farm.id === activeFarmId && (
                        <Badge variant="success" size="sm">{t('farms.activeFarm')}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <InfoCell Icon={MapPin} label={t('farms.location')} value={farm.locationDisplayName} />
                      <InfoCell
                        Icon={Sprout}
                        label={t('farms.crop')}
                        value={`${getCropLabel(farm.crop)} — ${t(`farms.stages.${farm.growthStage}` as Parameters<typeof t>[0])}`}
                      />
                      <InfoCell Icon={Ruler} label={t('farms.area')} value={`${farm.fieldAreaHa} ha`} />
                      <InfoCell
                        Icon={Droplets}
                        label={t('farms.irrigationMethod')}
                        value={t(`farms.irrigationMethods.${farm.irrigationMethod}` as Parameters<typeof t>[0])}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-[#F7F8F5] rounded-lg text-sm text-[#687168]">
                        <span className="font-medium">{t('farms.soilType')}:</span>{' '}
                        {t(`farms.soilTypes.${farm.soilType}` as Parameters<typeof t>[0])}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {farm.id !== activeFarmId && (
                      <Button variant="secondary" size="sm" onClick={() => onSetActiveFarm(farm.id)}>
                        <Radio size={12} /> {t('farms.setActive')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(farm)}>
                      <Pencil size={12} /> {t('common.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(farm)}>
                      <Trash2 size={12} /> {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        title={t('farms.deleteFarm')}
        onClose={() => setDeleteTarget(undefined)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(undefined)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[#202820]">
            {t('farms.confirmDelete')}{' '}
            <strong className="font-semibold text-[#202820]">{deleteTarget?.name}</strong>?
          </p>
          <p className="text-sm text-[#687168]">{t('settings.resetConfirmBody')}</p>
        </div>
      </Dialog>
    </DashboardLayout>
  )
}

import type { LucideIcon } from 'lucide-react'

function InfoCell({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#9AA49A] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#202820] flex items-center gap-1.5">
        <Icon size={13} className="text-[#527A45] flex-shrink-0" />
        <span className="truncate">{value}</span>
      </p>
    </div>
  )
}
