interface ForecastDay {
  day: string
  date: string
  icon: string
  high: number
  low: number
  rainfall: number
}

const forecastData: ForecastDay[] = [
  { day: 'Mon', date: 'Oct 12', icon: '☀️', high: 34, low: 24, rainfall: 0.0 },
  { day: 'Tue', date: 'Oct 13', icon: '⛅', high: 33, low: 25, rainfall: 0.0 },
  { day: 'Wed', date: 'Oct 14', icon: '🌤️', high: 34, low: 24, rainfall: 0.0 },
  { day: 'Thu', date: 'Oct 15', icon: '☁️', high: 32, low: 25, rainfall: 0.2 },
  { day: 'Fri', date: 'Oct 16', icon: '🌦️', high: 31, low: 25, rainfall: 1.5 },
  { day: 'Sat', date: 'Oct 17', icon: '🌧️', high: 30, low: 24, rainfall: 3.2 },
  { day: 'Sun', date: 'Oct 18', icon: '🌦️', high: 31, low: 25, rainfall: 0.8 },
]

export function SevenDayForecast() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">7-Day Weather Forecast</h3>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          View Details
          <span>→</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-4">
          {forecastData.map((day, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-gray-50 rounded-lg p-4 min-w-[120px]"
            >
              <p className="text-sm font-medium text-gray-500 mb-1">{day.day}</p>
              <p className="text-sm text-gray-700 mb-3">{day.date}</p>
              
              <div className="text-3xl mb-4">{day.icon}</div>
              
              <div className="text-center mb-2">
                <p className="text-lg font-semibold text-gray-900">
                  {day.high}°/{day.low}°
                </p>
              </div>
              
              <p className="text-sm text-gray-600">
                {day.rainfall.toFixed(1)} mm
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}