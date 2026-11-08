import { useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: 'What is the Irrigation Advisor?',
    a: 'The Advisor uses FAO-56 crop coefficients, real Open-Meteo weather data, and your manual soil moisture estimate to calculate whether irrigation is needed and how much to apply.',
  },
  {
    q: 'Is the soil moisture reading from a sensor?',
    a: 'No. AgriPulse AI does not connect to any real soil sensors or IoT devices. You manually enter your best estimate of the current Volumetric Water Content (VWC%) of your soil. The app clearly labels this as a manual estimate.',
  },
  {
    q: 'What does ET₀ mean?',
    a: 'ET₀ is Reference Evapotranspiration — the amount of water a well-irrigated grass reference crop would use per day. The app multiplies ET₀ by your crop\'s coefficient (Kc) to estimate actual crop water use (ETc = ET₀ × Kc).',
  },
  {
    q: 'Where does the weather data come from?',
    a: 'All weather data comes from Open-Meteo, a free and open-source weather API that does not require an API key. It provides real 7-day forecasts including ET₀ values.',
  },
  {
    q: 'Is my data shared with other users?',
    a: 'No. All farm data, irrigation records, and settings are stored locally in your browser using localStorage. Nothing is sent to any server. If you clear your browser data, your records will be lost.',
  },
  {
    q: 'How is the irrigation volume calculated?',
    a: 'The engine calculates net water demand over the forecast horizon (ETc × days − effective rainfall − soil moisture buffer), then converts it to litres based on your field area. The full formula trace is shown in the Irrigation Advisor.',
  },
  {
    q: 'What crops are supported?',
    a: 'Wheat, maize, rice (paddy), tomato, potato, soybean, cotton, and sugarcane. Each crop uses published FAO-56 Kc values for initial, mid-season, and end (late season) growth stages.',
  },
  {
    q: 'What does the Community module do?',
    a: 'The Farmer Community lets you share and read about real irrigation experiences from other farmers. In the current demo mode, posts are stored locally in your browser only. Shared community features require a backend to be configured.',
  },
]

export function HelpPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <DashboardLayout title="Help & Support" subtitle="Frequently asked questions and guidance for AgriPulse AI.">
      <div className="max-w-2xl space-y-5">
        {/* About */}
        <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
          <p className="text-sm font-semibold text-[#202820] mb-2">About AgriPulse AI</p>
          <p className="text-sm text-[#687168] leading-relaxed">
            AgriPulse AI is a formula-based irrigation recommendation tool. It uses real weather
            data from Open-Meteo and published FAO-56 crop coefficients to estimate when and how
            much to irrigate. It is designed for small and medium farms and works entirely in your
            browser with no account or server required.
          </p>
          <div className="mt-3 p-3 bg-[#EAF0E6] border border-[#C8D9C2] rounded-md text-xs text-[#24452D]">
            Not Claimed: real soil sensors · IoT devices · ML/AI inference · validated soil-water
            balance models · professional agronomic advice.
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-[#E0E5DD] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E0E5DD]">
            <p className="text-sm font-semibold text-[#202820]">Frequently Asked Questions</p>
          </div>
          <div className="divide-y divide-[#E0E5DD]">
            {FAQ.map(({ q, a }, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[#F7F8F5] transition-colors"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium text-[#202820]">{q}</span>
                  <ChevronDown
                    size={15}
                    className={['text-[#9AA49A] flex-shrink-0 mt-0.5 transition-transform', open === i ? 'rotate-180' : ''].join(' ')}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-[#687168] leading-relaxed border-t border-[#E0E5DD] pt-3 bg-[#F7F8F5]">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
          <p className="text-sm font-semibold text-[#202820] mb-3">External Resources</p>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Open-Meteo', url: 'https://open-meteo.com', note: 'Free weather API (no key required)' },
              { label: 'FAO Irrigation Paper No. 56', url: 'https://www.fao.org/docrep/X0490E/X0490E00.htm', note: 'Reference for all Kc values and ET₀ formulas' },
            ].map(({ label, url, note }) => (
              <li key={url} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#527A45] mt-1.5 flex-shrink-0" />
                <span>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#24452D] hover:underline font-medium">
                    {label}
                  </a>
                  {' — '}
                  <span className="text-[#9AA49A]">{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
