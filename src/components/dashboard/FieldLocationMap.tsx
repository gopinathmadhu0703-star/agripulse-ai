import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { getFarms, getActiveFarmId } from '../../store/farmStore'
import type { Farm } from '../../types'

export function FieldLocationMap() {
  const [farm, setFarm] = useState<Farm | null>(null)

  useEffect(() => {
    const farms = getFarms()
    const activeId = getActiveFarmId()
    const active = farms.find(f => f.id === activeId) ?? farms[0] ?? null
    setFarm(active)
  }, [])

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <p className="text-sm font-semibold text-[#202820] mb-4">Field Location</p>

      {farm ? (
        <div className="space-y-3">
          {/* Coordinate display — no fake maps */}
          <div className="bg-[#F7F8F5] border border-[#E0E5DD] rounded-md p-4 flex items-center gap-3">
            <MapPin size={18} className="text-[#527A45] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#202820]">{farm.locationDisplayName}</p>
              <p className="text-xs text-[#9AA49A] tabular-nums mt-0.5">
                {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Farm', value: farm.name },
              { label: 'Area', value: `${farm.fieldAreaHa} ha` },
              { label: 'Irrigation', value: farm.irrigationMethod },
              { label: 'Soil', value: farm.soilType },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F7F8F5] rounded-md px-3 py-2">
                <p className="text-2xs text-[#9AA49A] uppercase tracking-wide">{label}</p>
                <p className="text-xs font-semibold text-[#202820] mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <MapPin size={20} className="text-[#D0DCC9] mb-2" />
          <p className="text-sm text-[#9AA49A]">No farm selected</p>
        </div>
      )}
    </div>
  )
}
