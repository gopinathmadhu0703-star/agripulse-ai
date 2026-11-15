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
    if (!raw) return []
    const parsed: CommunityPost[] = JSON.parse(raw)
    // Never display seeded demo posts as real farmer experiences.
    return parsed.filter(p => p.tag !== 'demo')
  } catch {
    return []
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
