import { Link } from 'react-router-dom'
import {
  Droplets,
  CloudSun,
  BarChart2,
  Sprout,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
} from 'lucide-react'
import { useAuth } from '../components/auth/AuthProvider'

const FEATURES = [
  {
    Icon: CloudSun,
    title: 'Open-Meteo Weather',
    desc: 'Real 7-day forecasts with ET₀ and rainfall probability — no API key required.',
  },
  {
    Icon: Droplets,
    title: 'FAO-56 Irrigation Advisor',
    desc: 'Deterministic recommendations based on crop coefficients, soil type, and weather.',
  },
  {
    Icon: BarChart2,
    title: 'History & Analytics',
    desc: 'Track ETc trends, irrigation events, and recommendations over time with CSV export.',
  },
  {
    Icon: Sprout,
    title: 'Multi-crop Support',
    desc: 'Wheat, rice, maize, tomato, cotton, sugarcane, potato, and soybean — with proper Kc values.',
  },
  {
    Icon: ShieldCheck,
    title: 'Transparent Calculations',
    desc: 'Every recommendation shows the full FAO-56 formula trace, assumptions, and warnings.',
  },
  {
    Icon: Users,
    title: 'Farmer Community',
    desc: 'Share and learn from irrigation experiences across crops, districts, and growth stages.',
  },
]

const STEPS = [
  { n: '1', title: 'Add your farm', desc: 'Enter your location, crop, growth stage, soil type, and field area.' },
  { n: '2', title: 'Run the advisor', desc: 'Enter your current soil moisture estimate. The advisor fetches real weather and calculates water demand.' },
  { n: '3', title: 'Apply and track', desc: 'Follow the recommendation, schedule tasks in the planner, and record actual irrigation in the history.' },
]

export function LandingPage() {
  const { showSignInModal } = useAuth()

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Navigation */}
      <nav className="border-b border-[#E0E5DD] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#24452D] flex items-center justify-center">
              <Sprout size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[#24452D]">AgriPulse AI</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {[
              { href: '#features', label: 'Features' },
              { href: '#how', label: 'How it works' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-[#687168] hover:text-[#24452D] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={showSignInModal}
              className="text-sm text-[#687168] hover:text-[#24452D] px-3 py-1.5 transition-colors hidden sm:block"
            >
              Sign in
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 bg-[#24452D] text-white text-sm font-medium rounded-md hover:bg-[#1c3622] transition-colors"
            >
              <span className="hidden sm:inline">Open app</span>
              <span className="sm:hidden">Open</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#527A45] bg-[#EAF0E6] border border-[#C8D9C2] px-3 py-1 rounded-full mb-5">
            <Activity size={11} />
            FAO-56 · Open-Meteo · Supabase
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#202820] leading-tight mb-4">
            Smarter irrigation decisions for your farm
          </h1>
          <p className="text-sm md:text-base text-[#687168] leading-relaxed mb-7 max-w-lg">
            AgriPulse AI uses real weather forecasts and FAO-56 crop coefficients to calculate
            when and how much to irrigate — with full formula transparency and no fabricated sensor data.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#24452D] text-white text-sm font-medium rounded-md hover:bg-[#1c3622] transition-colors"
            >
              Open the dashboard <ArrowRight size={14} />
            </Link>
            <button
              onClick={showSignInModal}
              className="px-5 py-3 border border-[#E0E5DD] text-[#202820] text-sm font-medium rounded-md hover:bg-[#EAF0E6] hover:border-[#527A45] transition-colors"
            >
              Sign in with demo account
            </button>
          </div>
        </div>

        {/* App preview strip */}
        <div className="mt-10 md:mt-12 rounded-lg border border-[#E0E5DD] bg-white overflow-hidden shadow-card">
          <div className="h-8 border-b border-[#E0E5DD] bg-[#F7F8F5] px-4 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E0E5DD]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#E0E5DD]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#E0E5DD]" />
            <span className="ml-2 text-xs text-[#9AA49A]">AgriPulse AI — Dashboard</span>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Farm', value: 'Your Farm', sub: 'Select to see data' },
              { label: 'Irrigation', value: 'Awaiting input', sub: 'Run the advisor' },
              { label: 'ET₀ today', value: '— mm', sub: 'From Open-Meteo' },
              { label: 'Soil VWC', value: '— %', sub: 'Manual estimate' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-[#F7F8F5] rounded-md px-3 py-3">
                <p className="text-xs text-[#9AA49A]">{label}</p>
                <p className="text-sm font-semibold text-[#202820] mt-0.5">{value}</p>
                <p className="text-xs text-[#9AA49A] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[#E0E5DD] bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-xs font-semibold text-[#527A45] uppercase tracking-wider mb-2">Features</p>
          <h2 className="text-xl md:text-2xl font-semibold text-[#202820] mb-8 md:mb-10">Built for practical field use</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="border border-[#E0E5DD] rounded-lg p-4 md:p-5">
                <div className="w-8 h-8 rounded-md bg-[#EAF0E6] flex items-center justify-center mb-3">
                  <Icon size={15} className="text-[#527A45]" />
                </div>
                <h3 className="text-sm font-semibold text-[#202820] mb-1">{title}</h3>
                <p className="text-sm text-[#687168] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-xs font-semibold text-[#527A45] uppercase tracking-wider mb-2">How it works</p>
          <h2 className="text-xl md:text-2xl font-semibold text-[#202820] mb-8 md:mb-10">Three steps to a recommendation</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="bg-white border border-[#E0E5DD] rounded-lg p-4 md:p-5">
                <div className="w-7 h-7 rounded-full bg-[#24452D] text-white text-xs font-semibold flex items-center justify-center mb-3">
                  {n}
                </div>
                <h3 className="text-sm font-semibold text-[#202820] mb-1">{title}</h3>
                <p className="text-sm text-[#687168] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer banner */}
      <section className="border-t border-[#E0E5DD] bg-[#EAF0E6] py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-[#527A45] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#24452D]">
              <p className="font-semibold mb-1">Not Claimed</p>
              <p className="text-[#527A45] leading-relaxed text-xs md:text-sm">
                AgriPulse AI does not use real soil sensors, IoT devices, ML models, or validated
                soil-water balance models. All recommendations are deterministic, formula-based estimates
                and should not replace professional agronomic advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E0E5DD] bg-white py-5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#24452D] flex items-center justify-center">
              <Sprout size={11} className="text-white" />
            </div>
            <span className="text-sm text-[#687168]">AgriPulse AI</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-[#9AA49A]">
            <span>Weather: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#527A45]">Open-Meteo</a></span>
            <span>Formulas: FAO-56</span>
            <span>Kiro AI-DLC Challenge</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
