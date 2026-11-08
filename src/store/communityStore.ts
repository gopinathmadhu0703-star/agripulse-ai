/**
 * communityStore.ts
 *
 * Primary:  Supabase community_posts + post_comments + post_helpful_votes.
 * Fallback: localStorage (clearly labelled demo mode).
 *
 * Callers that need async DB access call the db* functions directly.
 * Sync functions (getPosts, getComments, etc.) always read localStorage
 * and are used for initial render before async data arrives.
 */

import type {
  CommunityPost,
  PostComment,
  FarmerProfile,
  CommunityFilters,
  IrrigationExperience,
  PostTag,
  PostLanguage,
  CommunityGroup,
} from '../types'
import {
  dbGetPosts,
  dbGetPostById,
  dbCreatePost,
  dbDeletePost,
  dbReportPost,
  dbVoteHelpful,
  dbHasVoted,
  dbGetComments,
  dbAddComment,
  dbDeleteComment,
} from '../lib/db/community'
import { isDbAvailable } from '../lib/db/client'

export { dbGetPosts, dbGetPostById, dbCreatePost, dbDeletePost,
         dbReportPost, dbVoteHelpful, dbHasVoted,
         dbGetComments, dbAddComment, dbDeleteComment }

const POSTS_KEY    = 'agripulse_community_posts'
const COMMENTS_KEY = 'agripulse_community_comments'
const PROFILE_KEY  = 'agripulse_farmer_profile'

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
function now(): string { return new Date().toISOString() }

// ── DB availability check (exported for UI) ──────────────────────────────────
export { isDbAvailable }

// ── localStorage demo-mode helpers ───────────────────────────────────────────

export function getPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (!raw) return [...DEMO_POSTS]
    const parsed: CommunityPost[] = JSON.parse(raw)
    const ids = new Set(parsed.map(p => p.id))
    return [...parsed, ...DEMO_POSTS.filter(p => !ids.has(p.id))]
  } catch {
    return [...DEMO_POSTS]
  }
}

function savePosts(posts: CommunityPost[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts.filter(p => p.tag !== 'demo')))
}

/** Creates a local-only post (used when DB is unavailable). */
export function createLocalPost(
  experience: IrrigationExperience,
  authorId: string,
  authorName: string,
  language: PostLanguage,
  tag: PostTag = 'self-reported'
): CommunityPost {
  const post: CommunityPost = {
    id: uuid(), authorId, authorName, language, tag, experience,
    helpfulVotes: 0, votedByUserIds: [], commentCount: 0,
    reported: false, createdAt: now(), updatedAt: now(),
  }
  savePosts([post, ...getPosts()])
  return post
}

export function getPostById(id: string): CommunityPost | undefined {
  return getPosts().find(p => p.id === id)
}

export function voteHelpfulLocal(postId: string, userId: string): void {
  const posts = getPosts()
  const post  = posts.find(p => p.id === postId)
  if (!post || post.tag === 'demo' || post.votedByUserIds.includes(userId)) return
  post.helpfulVotes += 1
  post.votedByUserIds.push(userId)
  post.updatedAt = now()
  savePosts(posts)
}

export function filterPosts(
  posts: CommunityPost[],
  filters: CommunityFilters
): CommunityPost[] {
  return posts.filter(post => {
    const e = post.experience
    if (filters.crop     && e.crop !== filters.crop)                       return false
    if (filters.district && !e.district.toLowerCase().includes(filters.district.toLowerCase())) return false
    if (filters.stage    && e.growthStage !== filters.stage)               return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (![e.crop, e.district, e.village, e.observations, post.authorName]
          .join(' ').toLowerCase().includes(q)) return false
    }
    return true
  })
}

// ── Comments (local) ──────────────────────────────────────────────────────────

export function getComments(postId: string): PostComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as PostComment[]).filter(c => c.postId === postId)
  } catch { return [] }
}

export function addCommentLocal(
  postId: string, text: string, authorId: string,
  authorName: string, language: PostLanguage
): PostComment {
  const comment: PostComment = {
    id: uuid(), postId, authorId, authorName,
    text: text.trim(), language, createdAt: now(),
  }
  const raw  = localStorage.getItem(COMMENTS_KEY)
  const all: PostComment[] = raw ? JSON.parse(raw) : []
  all.push(comment)
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all))
  return comment
}

// ── Farmer Profile ────────────────────────────────────────────────────────────

export function getFarmerProfile(userId: string): FarmerProfile | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveFarmerProfile(profile: FarmerProfile): void {
  localStorage.setItem(`${PROFILE_KEY}_${profile.userId}`, JSON.stringify(profile))
}

// ── Demo groups ───────────────────────────────────────────────────────────────

export const DEMO_GROUPS: CommunityGroup[] = [
  {
    id: 'g_001', name: 'Dharmapuri Rice Farmers',
    district: 'Dharmapuri', crop: 'rice', season: 'Kuruvai', memberCount: 47,
    description: 'Paddy farmers in Dharmapuri sharing Kuruvai and Samba season practices.',
  },
  {
    id: 'g_002', name: 'Coimbatore Cotton Growers',
    district: 'Coimbatore', crop: 'cotton', season: 'Kharif', memberCount: 31,
    description: 'Cotton cultivation experiences from Coimbatore region.',
  },
  {
    id: 'g_003', name: 'Salem Sugarcane Network',
    district: 'Salem', crop: 'sugarcane', memberCount: 22,
    description: 'Sugarcane irrigation and water management group.',
  },
]

// ── Demo posts (client-only, never persisted to DB) ───────────────────────────

const DEMO_POSTS: CommunityPost[] = [
  {
    id: 'demo_001', authorId: 'demo_author_1', authorName: 'Murugan (Demo)',
    language: 'ta', tag: 'demo',
    experience: {
      crop: 'rice', variety: 'ADT 43', district: 'Dharmapuri', village: 'Pennagaram area',
      hideExactLocation: false, soilType: 'clay', farmAreaHa: 0.4, growthStage: 'mid',
      cultivationStart: '2026-06-15', irrigationMethod: 'flood',
      irrigationDates: ['2026-06-15','2026-06-22','2026-06-29','2026-07-06'],
      sessions: 4, durationPerSessionMin: 240,
      rainfallObservations: 'About 15 mm rain on June 20. Skipped one session.',
      soilMoistureObservations: 'Soil visually dry at surface before each irrigation.',
      observations: 'Flood irrigation every 7 days worked well for ADT 43 in mid-season.',
    },
    helpfulVotes: 12, votedByUserIds: [], commentCount: 3, reported: false,
    createdAt: '2026-07-10T08:00:00.000Z', updatedAt: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'demo_002', authorId: 'demo_author_2', authorName: 'Lakshmi (Demo)',
    language: 'en', tag: 'demo',
    experience: {
      crop: 'tomato', district: 'Krishnagiri', village: 'Denkanikottai area',
      hideExactLocation: true, soilType: 'loamy', farmAreaHa: 0.2, growthStage: 'mid',
      cultivationStart: '2026-05-01', irrigationMethod: 'drip',
      irrigationDates: ['2026-05-01','2026-05-04','2026-05-07'],
      sessions: 3, durationPerSessionMin: 60, waterPerSessionLiters: 800,
      rainfallObservations: 'No significant rain during this period.',
      observations: 'Drip at 800 L per session every 3 days gave good flowering.',
    },
    helpfulVotes: 8, votedByUserIds: [], commentCount: 1, reported: false,
    createdAt: '2026-06-20T10:30:00.000Z', updatedAt: '2026-06-20T10:30:00.000Z',
  },
  {
    id: 'demo_003', authorId: 'demo_author_3', authorName: 'Rajan (Demo)',
    language: 'hi', tag: 'demo',
    experience: {
      crop: 'cotton', district: 'Coimbatore', village: 'Kinathukadavu area',
      hideExactLocation: false, soilType: 'sandy', farmAreaHa: 1.2, growthStage: 'initial',
      cultivationStart: '2026-07-01', irrigationMethod: 'furrow',
      irrigationDates: ['2026-07-01','2026-07-10'], sessions: 2,
      observations: 'Initial stage furrow irrigation twice. Sandy soil drained faster than expected.',
    },
    helpfulVotes: 4, votedByUserIds: [], commentCount: 0, reported: false,
    createdAt: '2026-07-15T07:00:00.000Z', updatedAt: '2026-07-15T07:00:00.000Z',
  },
]
