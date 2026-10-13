import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../../components/DashboardLayout'
import { getPostById, getComments, addComment, voteHelpful, reportPost } from '../../store/communityStore'
import { useAuth } from '../../components/auth/AuthProvider'
import type { CommunityPost, PostComment, PostLanguage } from '../../types'

const TAG_STYLES: Record<string, string> = {
  demo: 'bg-amber-100 text-amber-800 border-amber-200',
  'self-reported': 'bg-blue-50 text-blue-700 border-blue-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setPost(getPostById(id) ?? null)
    setComments(getComments(id))
  }, [id])

  if (!post) {
    return (
      <DashboardLayout title={t('community.title')}>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.noData')}</p>
          <button onClick={() => navigate('/community')} className="mt-4 text-sm text-emerald-600 hover:underline">
            ← {t('common.back')}
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const exp = post.experience
  const tagLabel =
    post.tag === 'demo'
      ? t('community.post.demoTag')
      : post.tag === 'verified'
      ? t('community.post.verifiedTag')
      : t('community.post.selfReportedTag')

  const handleVote = () => {
    voteHelpful(post.id, user?.id ?? 'anonymous')
    setPost(getPostById(post.id) ?? null)
  }

  const handleReport = () => {
    if (!confirm('Report this post as inappropriate?')) return
    reportPost(post.id)
    setPost(getPostById(post.id) ?? null)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return
    if (!user) { alert('Please sign in to comment.'); return }
    setSubmitting(true)
    try {
      addComment(post.id, commentText, user.id, user.name, i18n.language as PostLanguage)
      setCommentText('')
      setComments(getComments(post.id))
      setPost(getPostById(post.id) ?? null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title={t('community.title')}>
      <button
        onClick={() => navigate('/community')}
        className="mb-4 text-sm text-emerald-600 hover:underline flex items-center gap-1"
      >
        ← {t('common.back')}
      </button>

      {/* Disclaimer */}
      <div className="mb-5 p-3 bg-[#EDF4EB] border border-[#ACD1A0] rounded-xl">
        <p className="text-xs text-[#2C4F1E]">⚠️ {t('community.disclaimer')}</p>
      </div>

      {/* Post */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-bold text-[#2C4F1E] text-xl capitalize">
                {t(`farms.crops.${exp.crop}` as Parameters<typeof t>[0])}
                {exp.variety ? ` · ${exp.variety}` : ''}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TAG_STYLES[post.tag]}`}>
                {tagLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {t('community.post.by')} <strong>{post.authorName}</strong> ·{' '}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleVote}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              👍 {post.helpfulVotes} {t('community.post.helpful')}
            </button>
            {post.tag !== 'demo' && (
              <button
                onClick={handleReport}
                className="text-xs text-red-500 hover:text-red-600"
              >
                {t('community.post.report')}
              </button>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            { label: t('community.post.district'), value: exp.district },
            { label: t('community.post.village'), value: exp.hideExactLocation ? '—' : exp.village },
            { label: t('farms.soilType'), value: t(`farms.soilTypes.${exp.soilType}` as Parameters<typeof t>[0]) },
            { label: t('farms.area'), value: `${exp.farmAreaHa} ha` },
            { label: t('farms.growthStage'), value: t(`farms.stages.${exp.growthStage}` as Parameters<typeof t>[0]) },
            { label: t('farms.irrigationMethod'), value: t(`farms.irrigationMethods.${exp.irrigationMethod}` as Parameters<typeof t>[0]) },
            { label: t('community.form.sessions'), value: String(exp.sessions) },
            ...(exp.durationPerSessionMin ? [{ label: t('community.form.duration'), value: `${exp.durationPerSessionMin} min` }] : []),
            ...(exp.waterPerSessionLiters ? [{ label: t('community.form.waterQty'), value: `${exp.waterPerSessionLiters} L` }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Irrigation dates */}
        {exp.irrigationDates.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">{t('community.form.irrigationDates')}</p>
            <div className="flex flex-wrap gap-2">
              {exp.irrigationDates.map((d) => (
                <span key={d} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Observations */}
        {exp.rainfallObservations && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('community.form.rainfall')}</p>
            <p className="text-sm text-gray-700">{exp.rainfallObservations}</p>
          </div>
        )}
        {exp.soilMoistureObservations && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('community.form.soilMoisture')}</p>
            <p className="text-sm text-gray-700">{exp.soilMoistureObservations}</p>
          </div>
        )}
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 mb-1">{t('community.form.observations')}</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{exp.observations}</p>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">
          {t('community.post.comments')} ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">{t('community.post.noComments')}</p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{c.authorName}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        {user ? (
          <div className="flex gap-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('community.post.addComment')}
              rows={2}
              maxLength={500}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !commentText.trim()}
              className="self-end px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-lg transition-colors"
            >
              {t('community.post.submitComment')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('auth.signInTitle')} to comment.</p>
        )}
      </div>
    </DashboardLayout>
  )
}
