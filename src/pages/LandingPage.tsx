import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../components/auth/AuthProvider'

export function LandingPage() {
  const { showSignInModal } = useAuth()
  
  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2C4F1E] flex items-center justify-center">
                <span className="text-white text-xl">🌱</span>
              </div>
              <span className="text-xl font-semibold text-[#2C4F1E]">AgriPulse AI</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleScrollToSection('features')}
                className="text-[#5D615F] hover:text-[#2C4F1E] transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => handleScrollToSection('how-it-works')}
                className="text-[#5D615F] hover:text-[#2C4F1E] transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => handleScrollToSection('benefits')}
                className="text-[#5D615F] hover:text-[#2C4F1E] transition-colors font-medium"
              >
                Benefits
              </button>
              <button
                onClick={showSignInModal}
                className="text-[#5D615F] hover:text-[#2C4F1E] transition-colors font-medium"
              >
                Sign In
              </button>
              <Link to="/dashboard">
                <Button
                  className="bg-[#2C4F1E] hover:bg-[#1F3A15] text-white"
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-[#2C4F1E]">
              <span className="text-2xl">☰</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#081007] leading-tight mb-6">
                Grow Smarter.
                <span className="text-[#2C4F1E] block">Irrigate Better.</span>
              </h1>
              <p className="text-lg md:text-xl text-[#5D615F] mb-8 leading-relaxed">
                Make informed irrigation decisions with farm-specific insights, weather forecasts, 
                and transparent crop water-demand calculations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="flex-1">
                  <Button className="w-full bg-[#2C4F1E] hover:bg-[#1F3A15] text-white py-3 text-lg">
                    Explore Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => handleScrollToSection('how-it-works')}
                  className="flex-1 bg-transparent border-2 border-[#2C4F1E] text-[#2C4F1E] hover:bg-[#EDF4EB] py-3 text-lg"
                >
                  Discover How It Works
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-[#EDF4EB] to-[#ACD1A0] rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  {/* Dashboard Preview */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#EDF4EB] flex items-center justify-center">
                          <span className="text-xl text-[#2C4F1E]">🌾</span>
                        </div>
                        <div>
                          <p className="font-medium text-[#081007]">Farm Dashboard</p>
                          <p className="text-sm text-[#5D615F]">gopi • Rice (Paddy)</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-[#EDF4EB] text-[#2C4F1E] rounded-full text-sm font-medium">
                        Active
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#EDF4EB] rounded-lg p-4">
                        <p className="text-sm text-[#5D615F] mb-1">Temperature</p>
                        <p className="text-2xl font-bold text-[#081007]">34.3°C</p>
                      </div>
                      <div className="bg-[#EDF4EB] rounded-lg p-4">
                        <p className="text-sm text-[#5D615F] mb-1">ET₀</p>
                        <p className="text-2xl font-bold text-[#081007]">6.1 mm</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#5D615F]">Recommendation Status</span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                          Needs Attention
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#ACD1A0] to-transparent rounded-full opacity-30"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-[#EDF4EB] to-transparent rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust and Value Section */}
      <section className="py-16 bg-[#EDF4EB]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center">
                <span className="text-2xl text-[#2C4F1E]">💧</span>
              </div>
              <h3 className="text-xl font-semibold text-[#081007] mb-3">Smarter Water Management</h3>
              <p className="text-[#5D615F]">
                Optimize irrigation based on actual crop water demand rather than fixed schedules.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center">
                <span className="text-2xl text-[#2C4F1E]">🌤️</span>
              </div>
              <h3 className="text-xl font-semibold text-[#081007] mb-3">Weather-Informed Planning</h3>
              <p className="text-[#5D615F]">
                Incorporate real-time weather forecasts and historical climate data into your decisions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center">
                <span className="text-2xl text-[#2C4F1E]">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-[#081007] mb-3">Farm-Specific Recommendations</h3>
              <p className="text-[#5D615F]">
                Get tailored advice based on your specific crop, soil type, and irrigation method.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#081007] mb-4">
              Smart Irrigation Platform
            </h2>
            <p className="text-lg text-[#5D615F] max-w-2xl mx-auto">
              Everything you need to make data-informed irrigation decisions in one platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[#EDF4EB] flex items-center justify-center mb-6">
                  <span className="text-2xl text-[#2C4F1E]">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#081007] mb-3">{feature.title}</h3>
                <p className="text-[#5D615F]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-[#EDF4EB]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#081007] mb-4">
              How AgriPulse AI Works
            </h2>
            <p className="text-lg text-[#5D615F] max-w-2xl mx-auto">
              Three simple steps to get personalized irrigation recommendations for your farm.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-[#2C4F1E] text-white flex items-center justify-center text-xl font-bold mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-[#081007] mb-3">{step.title}</h3>
                  <p className="text-[#5D615F]">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#ACD1A0] transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#081007] mb-4">
              See Your Farm's Complete Picture
            </h2>
            <p className="text-lg text-[#5D615F] max-w-2xl mx-auto">
              A comprehensive dashboard that brings together weather, crops, soil, and irrigation recommendations.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-[#EDF4EB] to-[#ACD1A0] rounded-3xl p-1">
            <div className="bg-white rounded-2xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[#EDF4EB] flex items-center justify-center">
                      <span className="text-2xl text-[#2C4F1E]">📊</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#081007]">AgriPulse AI Dashboard</h3>
                      <p className="text-[#5D615F]">Illustrative preview • Not actual data</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#EDF4EB] rounded-xl p-4">
                        <p className="text-sm text-[#5D615F] mb-1">Field Area</p>
                        <p className="text-xl font-bold text-[#081007]">3 ha</p>
                      </div>
                      <div className="bg-[#EDF4EB] rounded-xl p-4">
                        <p className="text-sm text-[#5D615F] mb-1">Crop Stage</p>
                        <p className="text-xl font-bold text-[#081007]">End • Kc 1.05</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#EDF4EB] rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-[#081007]">Crop Water Demand (ETc)</h4>
                        <span className="text-sm text-[#2C4F1E] font-medium">This Week</span>
                      </div>
                      <div className="flex items-end gap-2 h-32">
                        {[30, 45, 60, 55, 50, 40, 35].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 bg-gradient-to-t from-[#2C4F1E] to-[#ACD1A0] rounded-t-lg"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-[#EDF4EB] rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-[#081007] mb-4">Weather Forecast</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {forecastDays.map((day, index) => (
                        <div key={index} className="text-center">
                          <p className="text-sm text-[#5D615F] mb-2">{day.day}</p>
                          <div className="text-2xl mb-2">{day.icon}</div>
                          <p className="font-medium text-[#081007]">{day.temp}</p>
                          <p className="text-xs text-[#5D615F]">{day.rain}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="font-semibold text-amber-800 mb-3">Irrigation Status</h4>
                    <p className="text-amber-700 mb-4">
                      Soil moisture data needed. A fresh manual VWC estimate is required for a reliable recommendation.
                    </p>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                      Run Irrigation Advisor
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 bg-[#EDF4EB]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#081007] mb-4">
              Make Every Drop Count
            </h2>
            <p className="text-lg text-[#5D615F] max-w-2xl mx-auto">
              Transform how you approach irrigation with data-driven insights.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2C4F1E] text-white flex items-center justify-center flex-shrink-0">
                    <span>✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#081007] mb-2">{benefit.title}</h3>
                    <p className="text-[#5D615F]">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#081007] mb-6">
              Make Every Irrigation Decision Count.
            </h2>
            <p className="text-lg text-[#5D615F] mb-8">
              Join farmers who use data to make informed irrigation decisions.
            </p>
            <Link to="/dashboard" className="inline-block">
              <Button className="bg-[#2C4F1E] hover:bg-[#1F3A15] text-white px-12 py-4 text-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#081007] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#2C4F1E] flex items-center justify-center">
                  <span className="text-white text-xl">🌱</span>
                </div>
                <span className="text-xl font-semibold text-white">AgriPulse AI</span>
              </div>
              <p className="text-gray-300">
                Smart irrigation recommendations powered by weather data and crop water-demand calculations.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Navigation</h4>
              <ul className="space-y-3">
                <li><button onClick={() => handleScrollToSection('features')} className="text-gray-300 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => handleScrollToSection('how-it-works')} className="text-gray-300 hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => handleScrollToSection('benefits')} className="text-gray-300 hover:text-white transition-colors">Benefits</button></li>
                <li><button onClick={showSignInModal} className="text-gray-300 hover:text-white transition-colors">Sign In</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Features</h4>
              <ul className="space-y-3">
                <li className="text-gray-300">Smart Irrigation Advisor</li>
                <li className="text-gray-300">Weather Insights</li>
                <li className="text-gray-300">Crop Water Analysis</li>
                <li className="text-gray-300">Irrigation Planner</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Platform</h4>
              <ul className="space-y-3">
                <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/farms" className="text-gray-300 hover:text-white transition-colors">Farms</Link></li>
                <li><Link to="/weather" className="text-gray-300 hover:text-white transition-colors">Weather</Link></li>
                <li><Link to="/advisor" className="text-gray-300 hover:text-white transition-colors">Advisor</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} AgriPulse AI. All rights reserved.</p>
            <p className="text-sm mt-2">An AI-assisted smart irrigation recommendation platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Data arrays
const features = [
  {
    icon: '💧',
    title: 'Smart Irrigation Advisor',
    description: 'Get personalized irrigation recommendations based on your specific farm conditions and weather forecasts.'
  },
  {
    icon: '🌤️',
    title: 'Real-Time Weather Insights',
    description: 'Access 7-day weather forecasts with ET₀ calculations to inform your irrigation planning.'
  },
  {
    icon: '🏠',
    title: 'Farm and Crop Management',
    description: 'Manage multiple farms, crops, and track growth stages with custom irrigation methods.'
  },
  {
    icon: '📊',
    title: 'Crop Water-Demand Analysis',
    description: 'Understand crop water requirements (ETc) using FAO-56 coefficients and reference evapotranspiration.'
  },
  {
    icon: '📅',
    title: 'Irrigation Planner',
    description: 'Schedule irrigation tasks, track completion, and maintain records of actual water applied.'
  },
  {
    icon: '📈',
    title: 'History and Analytics',
    description: 'Review past recommendations, track trends, and export data for further analysis.'
  }
]

const steps = [
  {
    number: '1',
    title: 'Add Your Farm',
    description: 'Enter your farm location, crop details, field area, soil type, and irrigation method.'
  },
  {
    number: '2',
    title: 'Review Conditions',
    description: 'Check weather forecasts and provide a soil moisture estimate when you have fresh data.'
  },
  {
    number: '3',
    title: 'Get Recommendations',
    description: 'Receive irrigation recommendations with transparent calculations and clear limitations.'
  }
]

const forecastDays = [
  { day: 'Mon', icon: '☀️', temp: '34°C', rain: '0.0 mm' },
  { day: 'Tue', icon: '⛅', temp: '33°C', rain: '0.0 mm' },
  { day: 'Wed', icon: '🌤️', temp: '34°C', rain: '0.0 mm' },
  { day: 'Thu', icon: '☁️', temp: '32°C', rain: '0.2 mm' },
  { day: 'Fri', icon: '🌦️', temp: '31°C', rain: '1.5 mm' },
  { day: 'Sat', icon: '🌧️', temp: '30°C', rain: '3.2 mm' }
]

const benefits = [
  {
    title: 'Informed Decision Making',
    description: 'Combine weather forecasts, crop coefficients, and soil moisture estimates to make data-driven irrigation decisions.'
  },
  {
    title: 'Water Use Planning',
    description: 'Plan your water application based on predicted crop water demand rather than fixed schedules or intuition.'
  },
  {
    title: 'Crop Water Understanding',
    description: 'Learn how crop water requirements change with growth stages and weather conditions through transparent calculations.'
  },
  {
    title: 'Farm-Specific Insights',
    description: 'Get recommendations tailored to your specific crop, soil type, location, and irrigation method.'
  }
]