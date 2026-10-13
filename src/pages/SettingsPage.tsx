import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import { SUPPORTED_LANGUAGES } from '../i18n/config'
import type { SupportedLanguage } from '../i18n/config'

interface SettingsPageProps {
  settings: AppSettings
  onSave: (settings: Partial<AppSettings>) => void
  onResetAll: () => void
}

export function SettingsPage({ settings, onSave, onResetAll }: SettingsPageProps) {
  const { t, i18n } = useTranslation()
  const [confirmReset, setConfirmReset] = useState(false)

  const HORIZON_OPTIONS = [
    { value: '1', label: t('settings.horizonDays.1') },
    { value: '2', label: t('settings.horizonDays.2') },
    { value: '3', label: t('settings.horizonDays.3') },
  ]

  const UNIT_OPTIONS = [
    { value: 'celsius', label: t('settings.units.celsius') },
    { value: 'fahrenheit', label: t('settings.units.fahrenheit') },
  ]

  const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.code,
    label: l.nativeLabel,
  }))

  return (
    <div className="space-y-5 max-w-lg">
      {/* Display preferences */}
      <Card header={t('settings.display')}>
        <div className="space-y-4">
          <Select
            label={t('settings.temperatureUnit')}
            options={UNIT_OPTIONS}
            value={settings.temperatureUnit}
            onChange={(e) =>
              onSave({ temperatureUnit: e.target.value as AppSettings['temperatureUnit'] })
            }
            helperText={t('settings.temperatureHint')}
          />
          <Select
            label={t('settings.forecastHorizon')}
            options={HORIZON_OPTIONS}
            value={String(settings.defaultHorizonDays)}
            onChange={(e) =>
              onSave({ defaultHorizonDays: parseInt(e.target.value) as 1 | 2 | 3 })
            }
          />
          <Select
            label={t('settings.language')}
            options={LANGUAGE_OPTIONS}
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value as SupportedLanguage)}
            helperText={t('settings.languageHint')}
          />
        </div>
      </Card>

      {/* Notification preferences */}
      <Card header={t('settings.notifications')}>
        <div className="space-y-3">
          {(
            [
              { key: 'rainAlert', label: t('settings.notif.rainAlert'), desc: t('settings.notif.rainAlertDesc') },
              { key: 'staleReading', label: t('settings.notif.staleReading'), desc: t('settings.notif.staleReadingDesc') },
              { key: 'taskDue', label: t('settings.notif.taskDue'), desc: t('settings.notif.taskDueDesc') },
            ] as const
          ).map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled[key]}
                onChange={(e) =>
                  onSave({
                    notificationsEnabled: {
                      ...settings.notificationsEnabled,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 rounded border-stone-300 text-forest-600"
              />
              <div>
                <p className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{label}</p>
                <p className="text-xs text-stone-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Data management */}
      <Card header={t('settings.dataManagement')}>
        <div className="space-y-3">
          <p className="text-sm text-stone-500">{t('settings.dataStoredLocally')}</p>
          <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
            {t('settings.resetAll')}
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card header={t('settings.about')}>
        <div className="text-sm text-stone-500 space-y-1.5">
          <p>
            {t('settings.aboutChallenge')}
          </p>
          <p>
            {t('settings.aboutWeather')}:{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-forest-600 hover:underline">
              Open-Meteo
            </a>{' '}
            (free, no API key)
          </p>
          <p>{t('settings.aboutFormulas')}</p>
          <p className="mt-3 text-xs border-t border-stone-100 pt-3">
            <strong>Not Claimed:</strong> {t('settings.aboutDisclaimer')}
          </p>
        </div>
      </Card>

      {/* Reset confirmation */}
      <Dialog
        open={confirmReset}
        title={t('settings.resetConfirmTitle')}
        onClose={() => setConfirmReset(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => { setConfirmReset(false); onResetAll() }}
            >
              {t('settings.resetAll')}
            </Button>
          </>
        }
      >
        <p>{t('settings.resetConfirmBody')}</p>
      </Dialog>
    </div>
  )
}
