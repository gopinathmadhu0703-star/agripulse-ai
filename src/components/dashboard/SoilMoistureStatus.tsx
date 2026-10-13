export function SoilMoistureStatus() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Soil Moisture Status</h3>
      
      <div className="flex flex-col items-center space-y-8">
        {/* Gauge */}
        <div className="relative">
          <div className="w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gray-50 flex flex-col items-center justify-center">
              <div className="text-4xl font-semibold text-gray-400">--%</div>
              <div className="text-sm text-gray-500 mt-1">VWC</div>
            </div>
          </div>
          
          {/* Warning Indicator */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-full">
            <span className="text-lg">⚠️</span>
            <span>Last reading: 7 days ago</span>
          </div>
        </div>
        
        {/* Action Button */}
        <button className="px-6 py-3 bg-gray-50 text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full max-w-xs">
          Enter Soil Moisture Reading
        </button>
      </div>
    </div>
  )
}