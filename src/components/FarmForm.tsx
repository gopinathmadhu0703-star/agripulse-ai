import React, { useState } from 'react'
import { z } from 'zod'
import type { Farm, CropType, GrowthStage, SoilType, IrrigationMethod } from '../types'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import { Alert } from './ui/Alert'
import { getCropList } from '../data/cropCoefficients'
import { getSoilList } from '../data/soilConstants'
import { geocodeLocation, GeocodingError, NetworkError } from '../api/openMeteo'
import type { GeoLocation } from '../types'
import { generateId } from '../store/farmStore'

const GROWTH_STAGES = [
  { value: 'initial', label: 'Initial (early growth, <10% cover)' },
  { value: 'mid', label: 'Mid-season (full cover)' },
  { value: 'end', label: 'End (maturity to harvest)' },
]

const IRRIGATION_METHODS = [
  { value: 'drip', label: 'Drip / Trickle' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'furrow', label: 'Furrow' },
  { value: 'flood', label: 'Flood / Basin' },
]

const FarmFormSchema = z.object({
  name: z.string().min(2, 'Farm name must be at least 2 characters'),
  locationName: z.string().min(2, 'Enter a location name'),
  fieldAreaHa: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .positive('Field area must be greater than 0')
    .max(100000, 'Field area seems too large — check units (hectares)'),
  crop: z.enum(['wheat', 'maize', 'rice', 'tomato', 'potato', 'soybean', 'cotton', 'sugarcane']),
  growthStage: z.enum(['initial', 'mid', 'end']),
  soilType: z.enum(['sandy', 'loamy', 'clay', 'silty']),
  irrigationMethod: z.enum(['drip', 'sprinkler', 'furrow', 'flood']),
})

type FormErrors = Partial<Record<keyof z.infer<typeof FarmFormSchema>, string>>

interface FarmFormProps {
  initial?: Farm
  onSave: (farm: Farm) => void
  onCancel?: () => void
}

export function FarmForm({ initial, onSave, onCancel }: FarmFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [locationName, setLocationName] = useState(initial?.locationName ?? '')
  const [fieldAreaHa, setFieldAreaHa] = useState(initial?.fieldAreaHa?.toString() ?? '')
  const [crop, setCrop] = useState<CropType>(initial?.crop ?? 'maize')
  const [growthStage, setGrowthStage] = useState<GrowthStage>(initial?.growthStage ?? 'mid')
  const [soilType, setSoilType] = useState<SoilType>(initial?.soilType ?? 'loamy')
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationMethod>(
    initial?.irrigationMethod ?? 'drip'
  )

  const [errors, setErrors] = useState<FormErrors>({})
  const [geoResults, setGeoResults] = useState<GeoLocation[]>([])
  const [selectedGeo, setSelectedGeo] = useState<GeoLocation | undefined>(
    initial
      ? {
          id: 0,
          name: initial.locationName,
          latitude: initial.latitude,
          longitude: initial.longitude,
          country: '',
          timezone: '',
          displayName: initial.locationDisplayName,
        }
      : undefined
  )
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  async function handleGeocodeSearch() {
    if (!locationName.trim()) return
    setGeoLoading(true)
    setGeoError(undefined)
    setGeoResults([])
    try {
      const results = await geocodeLocation(locationName)
      setGeoResults(results)
    } catch (err) {
      if (err instanceof GeocodingError) {
        setGeoError(err.message)
      } else if (err instanceof NetworkError) {
        setGeoError('Network error. Check your connection and try again.')
      } else {
        setGeoError('Failed to search for location.')
      }
    } finally {
      setGeoLoading(false)
    }
  }

  function handleGeoSelect(geo: GeoLocation) {
    setSelectedGeo(geo)
    setLocationName(geo.name)
    setGeoResults([])
  }

  function validate(): boolean {
    const result = FarmFormSchema.safeParse({
      name,
      locationName,
      fieldAreaHa: parseFloat(fieldAreaHa),
      crop,
      growthStage,
      soilType,
      irrigationMethod,
    })
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors
        errs[key] = issue.message
      }
      setErrors(errs)
      return false
    }
    setErrors({})
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!selectedGeo) {
      setGeoError('Please search and select a location from the results.')
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    const farm: Farm = {
      id: initial?.id ?? generateId(),
      name,
      locationName: selectedGeo.name,
      latitude: selectedGeo.latitude,
      longitude: selectedGeo.longitude,
      locationDisplayName: selectedGeo.displayName,
      fieldAreaHa: parseFloat(fieldAreaHa),
      crop,
      growthStage,
      soilType,
      irrigationMethod,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(farm)
    setSaving(false)
  }

  const cropList = getCropList()
  const soilList = getSoilList()

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Farm Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          placeholder="e.g. North Field"
        />
        <Input
          label="Field Area (hectares)"
          type="number"
          value={fieldAreaHa}
          onChange={(e) => setFieldAreaHa(e.target.value)}
          error={errors.fieldAreaHa}
          required
          min={0.01}
          step={0.1}
          placeholder="e.g. 2.5"
        />
      </div>

      {/* Location search */}
      <div className="space-y-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Location"
              value={locationName}
              onChange={(e) => {
                setLocationName(e.target.value)
                setSelectedGeo(undefined)
              }}
              error={errors.locationName}
              required
              placeholder="e.g. Bangalore, Karnataka"
              helperText={
                selectedGeo
                  ? `📍 ${selectedGeo.displayName}`
                  : 'Enter a location then click Search'
              }
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGeocodeSearch}
            loading={geoLoading}
            disabled={!locationName.trim()}
            className="shrink-0 mb-px"
          >
            Search
          </Button>
        </div>

        {geoError && <Alert variant="warning">{geoError}</Alert>}

        {geoResults.length > 0 && (
          <ul className="border border-[#E0E5DD] rounded-lg divide-y divide-stone-100 bg-white shadow-sm overflow-hidden">
            {geoResults.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => handleGeoSelect(g)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#EAF0E6] transition-colors"
                >
                  <span className="font-medium text-[#202820]">{g.name}</span>
                  {g.admin1 && (
                    <span className="text-[#687168]">, {g.admin1}</span>
                  )}
                  <span className="text-[#9AA49A]">, {g.country}</span>
                  <span className="text-xs text-[#9AA49A] ml-2">
                    ({g.latitude.toFixed(3)}, {g.longitude.toFixed(3)})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Crop"
          options={cropList}
          value={crop}
          onChange={(e) => setCrop(e.target.value as CropType)}
          error={errors.crop}
          required
        />
        <Select
          label="Growth Stage"
          options={GROWTH_STAGES}
          value={growthStage}
          onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
          error={errors.growthStage}
          required
          helperText="Select the current stage of crop development"
        />
        <Select
          label="Soil Type"
          options={soilList}
          value={soilType}
          onChange={(e) => setSoilType(e.target.value as SoilType)}
          error={errors.soilType}
          required
        />
        <Select
          label="Irrigation Method"
          options={IRRIGATION_METHODS}
          value={irrigationMethod}
          onChange={(e) => setIrrigationMethod(e.target.value as IrrigationMethod)}
          error={errors.irrigationMethod}
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={saving}>
          {initial ? 'Save Changes' : 'Add Farm'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
