import { useState } from 'react'

type TimeRange = 'week' | 'month'

interface ChartData {
  date: string
  etc: number
  et0: number
}

const sampleData: ChartData[] = [
  { date: 'Mon', etc: 5.2, et0: 6.1 },
  { date: 'Tue', etc: 5.8, et0: 6.5 },
  { date: 'Wed', etc: 6.1, et0: 7.0 },
  { date: 'Thu', etc: 5.9, et0: 6.8 },
  { date: 'Fri', etc: 5.5, et0: 6.3 },
  { date: 'Sat', etc: 5.3, et0: 6.0 },
  { date: 'Sun', etc: 5.0, et0: 5.8 },
]

export function CropWaterDemand() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  
  const maxValue = Math.max(...sampleData.map(d => Math.max(d.etc, d.et0)))
  const scaleFactor = 100 / maxValue

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Crop Water Demand (ETc)</h3>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              timeRange === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              timeRange === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>
      
      {/* Chart Visualization */}
      <div className="space-y-4">
        {/* Chart Bars */}
        <div className="flex items-end justify-between h-48 px-2">
          {sampleData.map((day, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
              {/* ETc Bar */}
              <div className="relative w-6">
                <div
                  className="w-full bg-emerald-500 rounded-t-lg"
                  style={{ height: `${day.etc * scaleFactor}%` }}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                  {day.date}
                </div>
              </div>
              
              {/* ET₀ Bar */}
              <div className="relative w-6">
                <div
                  className="w-full bg-blue-500 rounded-t-lg"
                  style={{ height: `${day.et0 * scaleFactor}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-sm text-gray-600">ETc (mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-sm text-gray-600">ET₀ (mm)</span>
          </div>
        </div>
        
        {/* Axis Labels */}
        <div className="flex justify-between text-xs text-gray-400 px-2">
          <span>0 mm</span>
          <span>{(maxValue / 2).toFixed(1)} mm</span>
          <span>{maxValue.toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  )
}