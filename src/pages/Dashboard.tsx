import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/DashboardLayout'
import { FarmSummaryCards } from '../components/dashboard/FarmSummaryCards'
import { TodaysWeather } from '../components/dashboard/TodaysWeather'
import { IrrigationRecommendation } from '../components/dashboard/IrrigationRecommendation'
import { CropWaterDemand } from '../components/dashboard/CropWaterDemand'
import { FieldLocationMap } from '../components/dashboard/FieldLocationMap'
import { SevenDayForecast } from '../components/dashboard/SevenDayForecast'
import { SoilMoistureStatus } from '../components/dashboard/SoilMoistureStatus'
import { RecentActivity } from '../components/dashboard/RecentActivity'

export function Dashboard() {
  const { t } = useTranslation()
  return (
    <DashboardLayout
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
    >
      {/* Farm Summary Cards */}
      <FarmSummaryCards />
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Weather */}
        <div className="lg:col-span-1">
          <TodaysWeather />
        </div>
        
        {/* Irrigation Recommendation */}
        <div className="lg:col-span-1">
          <IrrigationRecommendation />
        </div>
      </div>
      
      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6">
        {/* Crop Water Demand (wider) */}
        <div className="lg:col-span-4">
          <CropWaterDemand />
        </div>
        
        {/* Field Location & Map (narrower) */}
        <div className="lg:col-span-3">
          <FieldLocationMap />
        </div>
      </div>
      
      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 7-Day Forecast */}
        <div className="lg:col-span-1">
          <SevenDayForecast />
        </div>
        
        {/* Soil Moisture Status */}
        <div className="lg:col-span-1">
          <SoilMoistureStatus />
        </div>
      </div>
      
      {/* Recent Activity (full width) */}
      <div className="mb-6">
        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}