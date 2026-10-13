/**
 * communityStore.ts
 *
 * DEMO MODE: Posts and comments are stored in the user's own browser localStorage.
 * They are NOT shared with other farmers. This is clearly indicated in the UI.
 * When a real Supabase backend is configured, this store should be replaced with
 * Supabase queries with proper Row-Level Security (RLS) rules.
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

const POSTS_KEY = 'agripulse_community_posts'
const COMMENTS_KEY = 'agripulse_community_comments'
const PROFILE_KEY = 'agripulse_farmer_profile'

// ── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function now(): string {
  return new Date().toISOString()
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export function getPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (!raw) return [...DEMO_POSTS]
    const parsed: CommunityPost[] = JSON.parse(raw)
    // Always include demo posts at the end if not already present
    const ids = new Set(parsed.map((p) => p.id))
    const extras = DEMO_POSTS.filter((p) => !ids.has(p.id))
    return [...parsed, ...extras]
  } catch {
    return [...DEMO_POSTS]
  }
}

function savePosts(posts: CommunityPost[]): void {
  // Only persist non-demo posts to localStorage; demo posts are always injected at read time
  const toSave = posts.filter((p) => p.tag !== 'demo')
  localStorage.setItem(POSTS_KEY, JSON.stringify(toSave))
}

export function createPost(
  experience: IrrigationExperience,
  authorId: string,
  authorName: string,
  language: PostLanguage,
  tag: PostTag = 'self-reported'
): CommunityPost {
  const post: CommunityPost = {
    id: uuid(),
    authorId,
    authorName,
    language,
    tag,
    experience,
    helpfulVotes: 0,
    votedByUserIds: [],
    commentCount: 0,
    reported: false,
    createdAt: now(),
    updatedAt: now(),
  }
  const current = getPosts()
  savePosts([post, ...current])
  return post
}

export function getPostById(id: string): CommunityPost | undefined {
  return getPosts().find((p) => p.id === id)
}

export function voteHelpful(postId: string, userId: string): void {
  const posts = getPosts()
  const post = posts.find((p) => p.id === postId)
  if (!post) return
  if (post.tag === 'demo') return // demo posts votes don't persist
  if (post.votedByUserIds.includes(userId)) return // already voted
  post.helpfulVotes += 1
  post.votedByUserIds.push(userId)
  post.updatedAt = now()
  savePosts(posts)
}

export function reportPost(postId: string): void {
  const posts = getPosts()
  const post = posts.find((p) => p.id === postId)
  if (!post || post.tag === 'demo') return
  post.reported = true
  post.updatedAt = now()
  savePosts(posts)
}

export function deletePost(postId: string, userId: string): boolean {
  const posts = getPosts()
  const post = posts.find((p) => p.id === postId)
  if (!post) return false
  if (post.tag === 'demo') return false
  if (post.authorId !== userId) return false // only author can delete
  savePosts(posts.filter((p) => p.id !== postId))
  return true
}

// ── Filter posts ─────────────────────────────────────────────────────────────

export function filterPosts(
  posts: CommunityPost[],
  filters: CommunityFilters
): CommunityPost[] {
  return posts.filter((post) => {
    const exp = post.experience
    if (filters.crop && exp.crop !== filters.crop) return false
    if (filters.district && !exp.district.toLowerCase().includes(filters.district.toLowerCase()))
      return false
    if (filters.stage && exp.growthStage !== filters.stage) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const searchable = [
        exp.crop,
        exp.district,
        exp.village,
        exp.observations,
        post.authorName,
      ]
        .join(' ')
        .toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function getComments(postId: string): PostComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    if (!raw) return []
    const all: PostComment[] = JSON.parse(raw)
    return all.filter((c) => c.postId === postId)
  } catch {
    return []
  }
}

export function addComment(
  postId: string,
  text: string,
  authorId: string,
  authorName: string,
  language: PostLanguage
): PostComment {
  const comment: PostComment = {
    id: uuid(),
    postId,
    authorId,
    authorName,
    text: text.trim(),
    language,
    createdAt: now(),
  }

  const raw = localStorage.getItem(COMMENTS_KEY)
  const all: PostComment[] = raw ? JSON.parse(raw) : []
  all.push(comment)
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all))

  // Update comment count on post
  const posts = getPosts()
  const post = posts.find((p) => p.id === postId)
  if (post && post.tag !== 'demo') {
    post.commentCount += 1
    post.updatedAt = now()
    savePosts(posts)
  }

  return comment
}

export function deleteComment(commentId: string, userId: string): boolean {
  const raw = localStorage.getItem(COMMENTS_KEY)
  if (!raw) return false
  const all: PostComment[] = JSON.parse(raw)
  const comment = all.find((c) => c.id === commentId)
  if (!comment || comment.authorId !== userId) return false
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all.filter((c) => c.id !== commentId)))
  return true
}

// ── Farmer Profile ────────────────────────────────────────────────────────────

export function getFarmerProfile(userId: string): FarmerProfile | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${userId}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveFarmerProfile(profile: FarmerProfile): void {
  localStorage.setItem(`${PROFILE_KEY}_${profile.userId}`, JSON.stringify(profile))
}

// ── Demo groups ───────────────────────────────────────────────────────────────

export const DEMO_GROUPS: CommunityGroup[] = [
  {
    id: 'g_001',
    name: 'Dharmapuri Rice Farmers',
    district: 'Dharmapuri',
    crop: 'rice',
    season: 'Kuruvai',
    memberCount: 47,
    description: 'Paddy farmers in Dharmapuri sharing Kuruvai and Samba season practices.',
  },
  {
    id: 'g_002',
    name: 'Coimbatore Cotton Growers',
    district: 'Coimbatore',
    crop: 'cotton',
    season: 'Kharif',
    memberCount: 31,
    description: 'Cotton cultivation experiences from Coimbatore region.',
  },
  {
    id: 'g_003',
    name: 'Salem Sugarcane Network',
    district: 'Salem',
    crop: 'sugarcane',
    memberCount: 22,
    description: 'Sugarcane irrigation and water management group.',
  },
]

// ── Demo posts ────────────────────────────────────────────────────────────────
// These posts illustrate what real shared content would look like.
// They are clearly labelled "demo" and are not real farmer records.

const DEMO_POSTS: CommunityPost[] = [
  {
    id: 'demo_001',
    authorId: 'demo_author_1',
    authorName: 'Murugan (Demo)',
    language: 'ta',
    tag: 'demo',
    experience: {
      crop: 'rice',
      variety: 'ADT 43',
      district: 'Dharmapuri',
      village: 'Pennagaram area',
      hideExactLocation: false,
      soilType: 'clay',
      farmAreaHa: 0.4,
      growthStage: 'mid',
      cultivationStart: '2026-06-15',
      irrigationMethod: 'flood',
      irrigationDates: ['2026-06-15', '2026-06-22', '2026-06-29', '2026-07-06'],
      sessions: 4,
      durationPerSessionMin: 240,
      rainfallObservations: 'About 15 mm rain on June 20. Skipped one session.',
      soilMoistureObservations: 'Soil visually dry at surface before each irrigation.',
      observations:
        'Flood irrigation every 7 days worked well for ADT 43 in mid-season. Crop colour remained healthy throughout.',
    },
    helpfulVotes: 12,
    votedByUserIds: [],
    commentCount: 3,
    reported: false,
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'demo_002',
    authorId: 'demo_author_2',
    authorName: 'Lakshmi (Demo)',
    language: 'en',
    tag: 'demo',
    experience: {
      crop: 'tomato',
      district: 'Krishnagiri',
      village: 'Denkanikottai area',
      hideExactLocation: true,
      soilType: 'loamy',
      farmAreaHa: 0.2,
      growthStage: 'mid',
      cultivationStart: '2026-05-01',
      irrigationMethod: 'drip',
      irrigationDates: ['2026-05-01', '2026-05-04', '2026-05-07'],
      sessions: 3,
      durationPerSessionMin: 60,
      waterPerSessionLiters: 800,
      rainfallObservations: 'No significant rain during this period.',
      observations:
        'Drip at 800 L per session every 3 days gave good flowering. No water stress signs observed.',
    },
    helpfulVotes: 8,
    votedByUserIds: [],
    commentCount: 1,
    reported: false,
    createdAt: '2026-06-20T10:30:00.000Z',
    updatedAt: '2026-06-20T10:30:00.000Z',
  },
  {
    id: 'demo_003',
    authorId: 'demo_author_3',
    authorName: 'Rajan (Demo)',
    language: 'hi',
    tag: 'demo',
    experience: {
      crop: 'cotton',
      district: 'Coimbatore',
      village: 'Kinathukadavu area',
      hideExactLocation: false,
      soilType: 'sandy',
      farmAreaHa: 1.2,
      growthStage: 'initial',
      cultivationStart: '2026-07-01',
      irrigationMethod: 'furrow',
      irrigationDates: ['2026-07-01', '2026-07-10'],
      sessions: 2,
      observations:
        'Initial stage furrow irrigation twice. Sandy soil drained faster than expected.',
    },
    helpfulVotes: 4,
    votedByUserIds: [],
    commentCount: 0,
    reported: false,
    createdAt: '2026-07-15T07:00:00.000Z',
    updatedAt: '2026-07-15T07:00:00.000Z',
  },
]
