import { getRecommendations } from '../../store/historyStore'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatDateTime } from '../../utils/formatters'

export function CropWaterDemand() {
  const history = getRecommendations()

  const chartData = history.slice(-10).map(r => ({
    date: formatDateTime(r.createdAt).split(',')[0] ?? '',
    etcMm: Number(r.recommendation.etcDailyMm.toFixed(2)),
    et0Mm: Number(r.recommendation.et0DailyMm.toFixed(2)),
  }))

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
        <p className="text-sm font-semibold text-[#202820] mb-1">Crop Water Demand (ETc)</p>
        <p className="text-xs text-[#9AA49A] mb-4">ETc and ET₀ from your last 10 advisor runs</p>
        <div className="flex items-center justify-center h-32 bg-[#F7F8F5] rounded-md">
          <p className="text-sm text-[#9AA49A]">No data yet — run the Irrigation Advisor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <p className="text-sm font-semibold text-[#202820] mb-0.5">Crop Water Demand (ETc)</p>
      <p className="text-xs text-[#9AA49A] mb-4">Last {chartData.length} advisor runs · mm/day</p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E5DD" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9AA49A' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9AA49A' }}
            axisLine={false}
            tickLine={false}
            unit=" mm"
            width={44}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, border: '1px solid #E0E5DD', borderRadius: 6 }}
            formatter={(v: number, name: string) => [`${v} mm`, name === 'etcMm' ? 'ETc' : 'ET₀']}
          />
          <Bar dataKey="et0Mm" fill="#D0DCC9" radius={[2, 2, 0, 0]} name="ET₀" />
          <Bar dataKey="etcMm" fill="#527A45" radius={[2, 2, 0, 0]} name="ETc" />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-[#527A45]" />
          <span className="text-2xs text-[#687168]">ETc (crop)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-[#D0DCC9]" />
          <span className="text-2xs text-[#687168]">ET₀ (reference)</span>
        </div>
      </div>
    </div>
  )
}
