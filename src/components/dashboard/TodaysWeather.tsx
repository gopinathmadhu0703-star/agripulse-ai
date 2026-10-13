interface WeatherMetric {
  label: string
  value: string
  unit?: string
}

const weatherData = {
  location: 'Dharmapuri, Tamil Nadu',
  temperature: 34.3,
  condition: 'Partly Cloudy',
  metrics: [
    { label: 'Rainfall', value: '0.0', unit: 'mm' },
    { label: 'ET₀', value: '6.1', unit: 'mm' },
    { label: 'Wind', value: '11.2', unit: 'km/h' },
    { label: 'Humidity', value: '58', unit: '%' },
  ] as WeatherMetric[],
}

export function TodaysWeather() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Today's Weather</h3>
        <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <span className="text-lg">⟳</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Temperature and Location */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-gray-900">{weatherData.temperature}</span>
              <span className="text-2xl text-gray-500">°C</span>
            </div>
            <p className="text-base font-medium text-gray-900 mt-2">{weatherData.location}</p>
            <p className="text-sm text-gray-500">{weatherData.condition}</p>
          </div>
        </div>
        
        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {weatherData.metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 text-center"
            >
              <p className="text-sm font-medium text-gray-500 mb-1">{metric.label}</p>
              <p className="text-lg font-semibold text-gray-900">
                {metric.value}
                {metric.unit && <span className="text-sm font-normal text-gray-500 ml-0.5">{metric.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}