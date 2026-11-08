import { useTranslation } from 'react-i18next'
import type { CommunityPost } from '../../types'

interface PostCardProps {
  post: CommunityPost
  onVote: (id: string) => void
  onView: (id: string) => void
}

const TAG_STYLES: Record<string, string> = {
  demo: 'bg-amber-100 text-amber-800 border-amber-200',
  'self-reported': 'bg-blue-50 text-blue-700 border-blue-200',
  verified: 'bg-[#EAF0E6] text-[#24452D] border-[#C8D9C2]',
}

const CROP_EMOJI: Record<string, string> = {
  rice: '🌾',
  wheat: '🌾',
  maize: '🌽',
  tomato: '🍅',
  potato: '🥔',
  cotton: '🪴',
  sugarcane: '🎋',
  soybean: '🫘',
}

export function PostCard({ post, onVote, onView }: PostCardProps) {
  const { t } = useTranslation()
  const exp = post.experience
  const emoji = CROP_EMOJI[exp.crop] ?? '🌿'

  const tagLabel =
    post.tag === 'demo'
      ? t('community.post.demoTag')
      : post.tag === 'verified'
      ? t('community.post.verifiedTag')
      : t('community.post.selfReportedTag')

  const locationDisplay = exp.hideExactLocation
    ? exp.district
    : `${exp.village}, ${exp.district}`

  return (
    <article className="bg-white rounded-lg border border-[#E0E5DD] p-5 hover:border-[#C8D9C2] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-[#24452D] capitalize">
            {t(`farms.crops.${exp.crop}` as Parameters<typeof t>[0])}
            {exp.variety ? ` · ${exp.variety}` : ''}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TAG_STYLES[post.tag] ?? TAG_STYLES['self-reported']}`}
          >
            {tagLabel}
          </span>
        </div>
        <span className="text-xs text-[#9AA49A] whitespace-nowrap">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#687168] mb-3">
        <span>📍 {locationDisplay}</span>
        <span>🌱 {t(`farms.stages.${exp.growthStage}` as Parameters<typeof t>[0])}</span>
        <span>💧 {t(`farms.irrigationMethods.${exp.irrigationMethod}` as Parameters<typeof t>[0])}</span>
        <span>📐 {exp.farmAreaHa} ha</span>
        <span>🗓️ {exp.sessions} {exp.sessions === 1 ? 'session' : 'sessions'}</span>
      </div>

      <p className="text-sm text-[#202820] line-clamp-3 mb-4">{exp.observations}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[#687168]">
          <span>{t('community.post.by')} <strong className="text-[#202820]">{post.authorName}</strong></span>
          <button
            onClick={() => onVote(post.id)}
            className="flex items-center gap-1 text-[#527A45] hover:text-[#24452D] transition-colors"
            title={t('community.post.helpful')}
          >
            👍 {post.helpfulVotes}
          </button>
          <span>💬 {post.commentCount}</span>
        </div>
        <button
          onClick={() => onView(post.id)}
          className="text-xs text-[#527A45] hover:text-[#24452D] font-medium transition-colors"
        >
          {t('community.post.viewDetails')} →
        </button>
      </div>
    </article>
  )
}
