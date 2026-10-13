import { useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
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
        title={mode === 'add' ? 'Add New Farm' : `Edit Farm: ${editingFarm?.name}`}
        subtitle={mode === 'add' ? 'Add a new farm to start receiving irrigation recommendations' : 'Update your farm details'}
      >
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => { setMode('list'); setEditingFarm(undefined) }}>
              ← Back to Farms
            </Button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6">
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
      title="Farm Management"
      subtitle="Add, edit, and manage your farms"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {farms.length} farm{farms.length !== 1 ? 's' : ''} saved
            </h3>
            <p className="text-sm text-gray-500 mt-1">Select an active farm to receive recommendations</p>
          </div>
          <Button onClick={() => setMode('add')} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            + Add Farm
          </Button>
        </div>

        {/* Farm List */}
        {farms.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="text-3xl">🌾</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No farms yet</h3>
            <p className="text-gray-500 mb-6">Add your first farm to get irrigation recommendations.</p>
            <Button onClick={() => setMode('add')} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Your First Farm
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {farms.map((farm) => (
              <div key={farm.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{farm.name}</h3>
                      {farm.id === activeFarmId && (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <span>📍</span>
                          {farm.locationDisplayName}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Crop</p>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <span>🌱</span>
                          {getCropLabel(farm.crop)} — {farm.growthStage}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Field Area</p>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <span>📐</span>
                          {farm.fieldAreaHa} ha
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Irrigation Method</p>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <span>💧</span>
                          {farm.irrigationMethod}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-600">
                        <span className="font-medium">Soil:</span> {farm.soilType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    {farm.id !== activeFarmId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSetActiveFarm(farm.id)}
                        className="justify-center"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(farm)}
                      className="justify-center"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(farm)}
                      className="justify-center"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        title="Delete Farm"
        onClose={() => setDeleteTarget(undefined)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(undefined)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            Are you sure you want to delete <strong className="font-semibold text-gray-900">{deleteTarget?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            This will permanently remove the farm and all its associated data. This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </DashboardLayout>
  )
}