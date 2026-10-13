import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../components/auth/AuthProvider'
import { createPost } from '../../store/communityStore'
import type { IrrigationExperience, CropType, GrowthStage, SoilType, IrrigationMethod, PostLanguage } from '../../types'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const CROP_VALUES: CropType[] = ['wheat', 'maize', 'rice', 'tomato', 'potato', 'soybean', 'cotton', 'sugarcane']
const STAGE_VALUES: GrowthStage[] = ['initial', 'mid', 'end']
const SOIL_VALUES: SoilType[] = ['sandy', 'loamy', 'clay', 'silty']
const IRRIG_VALUES: IrrigationMethod[] = ['drip', 'sprinkler', 'furrow', 'flood']
const LANG_VALUES: { value: PostLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'hi', label: 'हिन्दी' },
]

function emptyForm(): Partial<IrrigationExperience> & { language: PostLanguage; hideExactLocation: boolean; hideContact: boolean } {
  return {
    crop: 'rice',
    variety: '',
    district: '',
    village: '',
    hideExactLocation: false,
    hideContact: false,
    soilType: 'loamy',
    farmAreaHa: 0.5,
    growthStage: 'initial',
    cultivationStart: '',
    cultivationEnd: '',
    irrigationMethod: 'drip',
    irrigationDates: [],
    sessions: 1,
    durationPerSessionMin: undefined,
    waterPerSessionLiters: undefined,
    rainfallObservations: '',
    soilMoistureObservations: '',
    observations: '',
    language: 'en',
  }
}

export function NewPostModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm())
  const [newDate, setNewDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addIrrigDate = () => {
    if (!newDate) return
    if ((form.irrigationDates ?? []).includes(newDate)) return
    set('irrigationDates', [...(form.irrigationDates ?? []), newDate].sort())
    setNewDate('')
  }

  const removeIrrigDate = (d: string) =>
    set('irrigationDates', (form.irrigationDates ?? []).filter((x) => x !== d))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.district?.trim()) e.district = t('community.form.district') + ' is required'
    if (!form.village?.trim()) e.village = t('community.form.village') + ' is required'
    if (!form.farmAreaHa || form.farmAreaHa <= 0) e.farmAreaHa = 'Farm area must be > 0'
    if (!form.cultivationStart) e.cultivationStart = t('community.form.cultivationStart') + ' is required'
    if ((form.irrigationDates ?? []).length === 0) e.irrigationDates = 'Add at least one irrigation date'
    if (!form.observations?.trim() || form.observations.trim().length < 20)
      e.observations = 'Please describe your experience (at least 20 characters)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!user) { alert('Please sign in first.'); return }
    setSubmitting(true)
    try {
      const experience: IrrigationExperience = {
        crop: form.crop as CropType,
        variety: form.variety || undefined,
        district: form.district!.trim(),
        village: form.village!.trim(),
        hideExactLocation: form.hideExactLocation,
        soilType: form.soilType as SoilType,
        farmAreaHa: Number(form.farmAreaHa),
        growthStage: form.growthStage as GrowthStage,
        cultivationStart: form.cultivationStart!,
        cultivationEnd: form.cultivationEnd || undefined,
        irrigationMethod: form.irrigationMethod as IrrigationMethod,
        irrigationDates: form.irrigationDates ?? [],
        sessions: Number(form.sessions),
        durationPerSessionMin: form.durationPerSessionMin ? Number(form.durationPerSessionMin) : undefined,
        waterPerSessionLiters: form.waterPerSessionLiters ? Number(form.waterPerSessionLiters) : undefined,
        rainfallObservations: form.rainfallObservations || undefined,
        soilMoistureObservations: form.soilMoistureObservations || undefined,
        observations: form.observations!.trim(),
      }
      createPost(experience, user.id, user.name, form.language, 'self-reported')
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const Err = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-red-600 mt-1">{errors[field]}</p> : null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#2C4F1E]">{t('community.form.title')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Demo mode warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              🔔 {t('community.form.demoModeWarning')}
            </div>
            <div className="p-3 bg-[#EDF4EB] border border-[#ACD1A0] rounded-lg text-xs text-[#2C4F1E]">
              ℹ️ {t('community.form.safetyNote')}
            </div>

            {/* Post language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.language')}</label>
              <select
                value={form.language}
                onChange={(e) => set('language', e.target.value as PostLanguage)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {LANG_VALUES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {/* Crop & variety */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.crop')}</label>
                <select
                  value={form.crop}
                  onChange={(e) => set('crop', e.target.value as CropType)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CROP_VALUES.map((c) => (
                    <option key={c} value={c}>{t(`farms.crops.${c}` as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('community.form.cropVariety')}
                </label>
                <input
                  type="text"
                  value={form.variety ?? ''}
                  onChange={(e) => set('variety', e.target.value)}
                  placeholder="e.g. ADT 43"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* District & village */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.district')} *</label>
                <input
                  type="text"
                  value={form.district ?? ''}
                  onChange={(e) => set('district', e.target.value)}
                  className={`w-full text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.district ? 'border-red-400' : 'border-gray-200'}`}
                />
                <Err field="district" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.village')} *</label>
                <input
                  type="text"
                  value={form.village ?? ''}
                  onChange={(e) => set('village', e.target.value)}
                  className={`w-full text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.village ? 'border-red-400' : 'border-gray-200'}`}
                />
                <Err field="village" />
              </div>
            </div>

            {/* Soil & area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.soilType')}</label>
                <select
                  value={form.soilType}
                  onChange={(e) => set('soilType', e.target.value as SoilType)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SOIL_VALUES.map((s) => (
                    <option key={s} value={s}>{t(`farms.soilTypes.${s}` as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.farmArea')} *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={form.farmAreaHa ?? ''}
                  onChange={(e) => set('farmAreaHa', parseFloat(e.target.value))}
                  className={`w-full text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.farmAreaHa ? 'border-red-400' : 'border-gray-200'}`}
                />
                <Err field="farmAreaHa" />
              </div>
            </div>

            {/* Growth stage & method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.growthStage')}</label>
                <select
                  value={form.growthStage}
                  onChange={(e) => set('growthStage', e.target.value as GrowthStage)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {STAGE_VALUES.map((s) => (
                    <option key={s} value={s}>{t(`farms.stages.${s}` as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.irrigationMethod')}</label>
                <select
                  value={form.irrigationMethod}
                  onChange={(e) => set('irrigationMethod', e.target.value as IrrigationMethod)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {IRRIG_VALUES.map((m) => (
                    <option key={m} value={m}>{t(`farms.irrigationMethods.${m}` as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.cultivationStart')} *</label>
                <input
                  type="date"
                  value={form.cultivationStart ?? ''}
                  onChange={(e) => set('cultivationStart', e.target.value)}
                  className={`w-full text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.cultivationStart ? 'border-red-400' : 'border-gray-200'}`}
                />
                <Err field="cultivationStart" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.cultivationEnd')}</label>
                <input
                  type="date"
                  value={form.cultivationEnd ?? ''}
                  onChange={(e) => set('cultivationEnd', e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Irrigation dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('community.form.irrigationDates')} *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addIrrigDate}
                  className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {t('community.form.addDate')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.irrigationDates ?? []).map((d) => (
                  <span key={d} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                    {d}
                    <button type="button" onClick={() => removeIrrigDate(d)} className="text-emerald-400 hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
              <Err field="irrigationDates" />
            </div>

            {/* Sessions & duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.sessions')}</label>
                <input
                  type="number"
                  min="1"
                  value={form.sessions ?? ''}
                  onChange={(e) => set('sessions', parseInt(e.target.value))}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.duration')}</label>
                <input
                  type="number"
                  min="1"
                  value={form.durationPerSessionMin ?? ''}
                  onChange={(e) => set('durationPerSessionMin', parseInt(e.target.value) || undefined)}
                  placeholder="optional"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.waterQty')}</label>
                <input
                  type="number"
                  min="1"
                  value={form.waterPerSessionLiters ?? ''}
                  onChange={(e) => set('waterPerSessionLiters', parseInt(e.target.value) || undefined)}
                  placeholder="optional"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Rainfall & soil observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.rainfall')}</label>
              <textarea
                value={form.rainfallObservations ?? ''}
                onChange={(e) => set('rainfallObservations', e.target.value)}
                rows={2}
                placeholder="e.g. 20mm rain on July 10, skipped one session"
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.soilMoisture')}</label>
              <textarea
                value={form.soilMoistureObservations ?? ''}
                onChange={(e) => set('soilMoistureObservations', e.target.value)}
                rows={2}
                placeholder="e.g. Soil appeared dry at 2cm before each irrigation"
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Main observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('community.form.observations')} *</label>
              <textarea
                value={form.observations ?? ''}
                onChange={(e) => set('observations', e.target.value)}
                rows={4}
                placeholder={t('community.form.observationsHint')}
                className={`w-full text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${errors.observations ? 'border-red-400' : 'border-gray-200'}`}
              />
              <Err field="observations" />
            </div>

            {/* Privacy */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('community.form.privacy')}</p>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hideExactLocation}
                  onChange={(e) => set('hideExactLocation', e.target.checked)}
                  className="rounded"
                />
                {t('community.form.hideExactLocation')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hideContact}
                  onChange={(e) => set('hideContact', e.target.checked)}
                  className="rounded"
                />
                {t('community.form.hideContact')}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              {t('community.form.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-lg transition-colors"
            >
              {submitting ? t('common.loading') : t('community.form.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
