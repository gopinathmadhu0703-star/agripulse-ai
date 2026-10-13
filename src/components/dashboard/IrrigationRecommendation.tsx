export function IrrigationRecommendation() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 relative overflow-hidden">
      {/* Warning accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
      
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Irrigation Recommendation</h3>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
          Needs Attention
        </span>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <h4 className="text-lg font-semibold text-amber-800 mb-2">Collect Fresh Reading</h4>
          <p className="text-sm text-amber-700">
            Soil moisture data is missing or outdated. A fresh manual VWC estimate is needed before a reliable recommendation can be made.
          </p>
        </div>
        
        <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          <span className="text-lg">💧</span>
          Run Advisor
        </button>
      </div>
    </div>
  )
}