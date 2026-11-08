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
      {/* Farm summary bar */}
      <FarmSummaryCards />

      {/* Primary row: weather + recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TodaysWeather />
        <IrrigationRecommendation />
      </div>

      {/* Secondary row: soil + ETc chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <SoilMoistureStatus />
        <div className="lg:col-span-2">
          <CropWaterDemand />
        </div>
      </div>

      {/* Third row: forecast + location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <SevenDayForecast />
        </div>
        <FieldLocationMap />
      </div>

      {/* Activity */}
      <RecentActivity />
    </DashboardLayout>
  )
}
