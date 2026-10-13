import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../../components/DashboardLayout'
import { getPosts, filterPosts, voteHelpful, DEMO_GROUPS } from '../../store/communityStore'
import { useAuth } from '../../components/auth/AuthProvider'
import type { CommunityPost, CommunityFilters, CropType, GrowthStage } from '../../types'
import { NewPostModal } from './NewPostModal'
import { PostCard } from './PostCard'

const CROP_OPTIONS: { value: CropType | ''; label: string }[] = [
  { value: '', label: 'All Crops' },
  { value: 'rice', label: 'Rice' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'maize', label: 'Maize' },
  { value: 'tomato', label: 'Tomato' },
  { value: 'potato', label: 'Potato' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'soybean', label: 'Soybean' },
]

const STAGE_OPTIONS: { value: GrowthStage | ''; label: string }[] = [
  { value: '', label: 'All Stages' },
  { value: 'initial', label: 'Initial' },
  { value: 'mid', label: 'Mid-Season' },
  { value: 'end', label: 'Late Season' },
]

export function CommunityPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<CommunityFilters>({ search: '', crop: '', district: '', stage: '' })
  const [showNewPost, setShowNewPost] = useState(false)
  const [posts, setPosts] = useState<CommunityPost[]>(() => getPosts())

  const refresh = useCallback(() => setPosts(getPosts()), [])

  const filtered = filterPosts(posts, filters)

  return (
    <DashboardLayout
      title={t('community.title')}
      subtitle={t('community.subtitle')}
    >
      {/* Demo Mode Banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <span className="text-xl mt-0.5">🔔</span>
        <div>
          <p className="text-sm font-medium text-amber-800">
            {t('common.demoMode')}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {t('community.form.demoModeWarning')}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-5 p-3 bg-[#EDF4EB] border border-[#ACD1A0] rounded-xl">
        <p className="text-xs text-[#2C4F1E]">⚠️ {t('community.disclaimer')}</p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={t('community.searchPlaceholder')}
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {/* Crop filter */}
          <select
            value={filters.crop ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, crop: e.target.value as CropType | '' }))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {CROP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* District filter */}
          <input
            type="text"
            placeholder={t('community.filters.district') + '…'}
            value={filters.district ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none w-40"
          />

          {/* Stage filter */}
          <select
            value={filters.stage ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value as GrowthStage | '' }))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => user ? setShowNewPost(true) : alert('Please sign in to share a post.')}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <span>✏️</span>
          {t('community.newPost')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Post list */}
        <div className="lg:col-span-3 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <span className="text-4xl">🌾</span>
              <p className="mt-3 text-gray-500 text-sm">
                {(filters.search || filters.crop || filters.district || filters.stage)
                  ? t('community.noResults')
                  : t('community.empty')}
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={(id) => { voteHelpful(id, user?.id ?? 'anonymous'); refresh() }}
                onView={(id) => navigate(`/community/post/${id}`)}
              />
            ))
          )}
        </div>

        {/* Sidebar: groups */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-[#2C4F1E] text-sm mb-3">
              {t('community.groups.title')}
            </h3>
            <div className="space-y-3">
              {DEMO_GROUPS.map((g) => (
                <div key={g.id} className="p-3 bg-[#EDF4EB] rounded-lg">
                  <p className="text-sm font-medium text-[#2C4F1E]">{g.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {g.memberCount} {t('community.groups.members')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onSuccess={() => { refresh(); setShowNewPost(false) }}
        />
      )}
    </DashboardLayout>
  )
}
