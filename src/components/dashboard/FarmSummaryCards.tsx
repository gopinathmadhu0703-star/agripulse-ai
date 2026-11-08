import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout, Ruler, Droplets, TrendingUp } from 'lucide-react'
import { getFarms, getActiveFarmId } from '../../store/farmStore'
import { getCropLabel } from '../../data/cropCoefficients'
import type { Farm } from '../../types'

export function FarmSummaryCards() {
  const [farm, setFarm] = useState<Farm | null>(null)

  useEffect(() => {
    const farms = getFarms()
    const activeId = getActiveFarmId()
    const active = farms.find(f => f.id === activeId) ?? farms[0] ?? null
    setFarm(active)
  }, [])

  if (!farm) {
    return (
      <div className="mb-5 p-4 bg-white border border-[#E0E5DD] rounded-lg flex items-center justify-between">
        <p className="text-sm text-[#687168]">No farm configured yet.</p>
        <Link
          to="/farms"
          className="text-sm font-medium text-[#24452D] hover:underline"
        >
          Add a farm →
        </Link>
      </div>
    )
  }

  const items = [
    {
      Icon: Sprout,
      label: 'Active Farm',
      value: farm.name,
      sub: getCropLabel(farm.crop),
    },
    {
      Icon: Ruler,
      label: 'Field Area',
      value: `${farm.fieldAreaHa} ha`,
      sub: `${farm.irrigationMethod} irrigation`,
    },
    {
      Icon: Droplets,
      label: 'Soil Type',
      value: farm.soilType.charAt(0).toUpperCase() + farm.soilType.slice(1),
      sub: farm.locationDisplayName,
    },
    {
      Icon: TrendingUp,
      label: 'Growth Stage',
      value: farm.growthStage === 'initial' ? 'Initial' : farm.growthStage === 'mid' ? 'Mid-season' : 'Late season',
      sub: `Lat ${farm.latitude.toFixed(2)}, Lon ${farm.longitude.toFixed(2)}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(({ Icon, label, value, sub }) => (
        <div key={label} className="bg-white border border-[#E0E5DD] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={13} className="text-[#527A45]" />
            <p className="text-xs text-[#687168] font-medium">{label}</p>
          </div>
          <p className="text-sm font-semibold text-[#202820] truncate">{value}</p>
          <p className="text-xs text-[#9AA49A] truncate mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  )
}
