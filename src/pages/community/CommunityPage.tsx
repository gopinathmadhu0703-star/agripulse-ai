import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Edit3, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import {
  getPosts, filterPosts, voteHelpfulLocal, DEMO_GROUPS,
  dbGetPosts, dbVoteHelpful, isDbAvailable,
} from '../../store/communityStore'
import { useAuth } from '../../components/auth/AuthProvider'
import type { CommunityPost, CommunityFilters, CropType, GrowthStage } from '../../types'
import { NewPostModal } from './NewPostModal'
import { PostCard } from './PostCard'

const CROP_OPTIONS: { value: CropType | ''; label: string }[] = [
  { value: '', label: 'All Crops' },
  { value: 'rice',      label: 'Rice' },
  { value: 'wheat',     label: 'Wheat' },
  { value: 'maize',     label: 'Maize' },
  { value: 'tomato',    label: 'Tomato' },
  { value: 'potato',    label: 'Potato' },
  { value: 'cotton',    label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'soybean',   label: 'Soybean' },
]

const STAGE_OPTIONS: { value: GrowthStage | ''; label: string }[] = [
  { value: '',        label: 'All Stages' },
  { value: 'initial', label: 'Initial' },
  { value: 'mid',     label: 'Mid-Season' },
  { value: 'end',     label: 'Late Season' },
]

export function CommunityPage() {
  const { t }    = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const dbAvailable = isDbAvailable()

  const [filters, setFilters]     = useState<CommunityFilters>({ search: '', crop: '', district: '', stage: '' })
  const [showNewPost, setShowNew] = useState(false)
  const [posts, setPosts]         = useState<CommunityPost[]>(() => getPosts())
  const [loadingDb, setLoadingDb] = useState(false)
  const [dbError, setDbError]     = useState<string | null>(null)

  // Load from DB when available
  const loadFromDb = useCallback(async () => {
    if (!dbAvailable) return
    setLoadingDb(true)
    setDbError(null)
    try {
      const dbPosts = await dbGetPosts(filters)
      // Merge with demo posts (demo posts are never in DB)
      const localDemoPosts = getPosts().filter(p => p.tag === 'demo')
      const ids = new Set(dbPosts.map(p => p.id))
      setPosts([...dbPosts, ...localDemoPosts.filter(p => !ids.has(p.id))])
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Failed to load posts')
      setPosts(getPosts()) // fallback to localStorage
    } finally {
      setLoadingDb(false)
    }
  }, [dbAvailable, filters])

  useEffect(() => { loadFromDb() }, [loadFromDb])

  const handleVote = async (postId: string) => {
    if (!user) return
    if (dbAvailable) {
      try {
        await dbVoteHelpful(postId, user.id)
        await loadFromDb()
      } catch { /* silent */ }
    } else {
      voteHelpfulLocal(postId, user.id)
      setPosts(getPosts())
    }
  }

  const filtered = dbAvailable ? posts : filterPosts(posts, filters)

  return (
    <DashboardLayout title={t('community.title')} subtitle={t('community.subtitle')}>
      {/* Mode banner */}
      {!dbAvailable ? (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t('common.demoMode')}</p>
            <p className="text-xs text-amber-700 mt-0.5">{t('community.form.demoModeWarning')}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-[#EAF0E6] border border-[#C8D9C2] rounded-md flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#527A45]" />
          <p className="text-xs text-[#24452D] font-medium">Connected — posts are shared with all farmers</p>
        </div>
      )}

      {dbError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          Database error: {dbError}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mb-5 p-3 bg-[#F7F8F5] border border-[#E0E5DD] rounded-md">
        <p className="text-xs text-[#687168]">{t('community.disclaimer')}</p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A]" />
            <input
              type="text"
              placeholder={t('community.searchPlaceholder')}
              value={filters.search ?? ''}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] outline-none"
            />
          </div>
          <select
            value={filters.crop ?? ''}
            onChange={e => setFilters(f => ({ ...f, crop: e.target.value as CropType | '' }))}
            className="text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md px-3 py-2 text-[#202820] focus:ring-2 focus:ring-[#24452D] outline-none"
          >
            {CROP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="text"
            placeholder={t('community.filters.district') + '…'}
            value={filters.district ?? ''}
            onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
            className="text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md px-3 py-2 text-[#202820] focus:ring-2 focus:ring-[#24452D] outline-none w-36"
          />
          <select
            value={filters.stage ?? ''}
            onChange={e => setFilters(f => ({ ...f, stage: e.target.value as GrowthStage | '' }))}
            className="text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md px-3 py-2 text-[#202820] focus:ring-2 focus:ring-[#24452D] outline-none"
          >
            {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <button
          onClick={() => user ? setShowNew(true) : alert('Please sign in to share a post.')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24452D] hover:bg-[#1c3622] rounded-md transition-colors whitespace-nowrap"
        >
          <Edit3 size={13} />
          {t('community.newPost')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-3">
          {loadingDb ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-[#F7F8F5] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[#E0E5DD]">
              <p className="text-sm text-[#9AA49A]">
                {(filters.search || filters.crop || filters.district || filters.stage)
                  ? t('community.noResults')
                  : t('community.empty')}
              </p>
            </div>
          ) : (
            filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={handleVote}
                onView={id => navigate(`/community/post/${id}`)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-[#E0E5DD] p-4">
            <p className="text-sm font-semibold text-[#202820] mb-3">{t('community.groups.title')}</p>
            <div className="space-y-3">
              {DEMO_GROUPS.map(g => (
                <div key={g.id} className="p-3 bg-[#F7F8F5] rounded-md">
                  <p className="text-xs font-semibold text-[#202820]">{g.name}</p>
                  <p className="text-xs text-[#9AA49A] mt-0.5">{g.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNew(false)}
          onSuccess={() => { loadFromDb(); setShowNew(false) }}
        />
      )}
    </DashboardLayout>
  )
}
