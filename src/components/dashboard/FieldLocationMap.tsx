export function FieldLocationMap() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Field Location & Map</h3>
      
      <div className="space-y-6">
        {/* Map Placeholder */}
        <div className="relative bg-emerald-50 rounded-lg overflow-hidden h-48">
          {/* Simple map grid */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-50">
            <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] bg-[length:20px_20px] opacity-20" />
          </div>
          
          {/* Field Boundary */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-500 rounded-2xl border-dashed" />
          
          {/* Location Marker */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-white rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">📍</span>
            </div>
          </div>
        </div>
        
        {/* Farm Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Farm name</p>
            <p className="text-base font-semibold text-gray-900">gopi</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Area</p>
            <p className="text-base font-semibold text-gray-900">3 ha</p>
          </div>
          
          <div className="md:col-span-2 space-y-1">
            <p className="text-sm font-medium text-gray-500">Location</p>
            <p className="text-base font-semibold text-gray-900">Dharmapuri, Tamil Nadu, India</p>
          </div>
        </div>
      </div>
    </div>
  )
}