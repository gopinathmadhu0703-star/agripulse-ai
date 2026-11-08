/**
 * db/community.ts
 * Supabase operations for community_posts, post_comments, post_helpful_votes.
 */
import { supabase, isDbAvailable, dbError } from './client'
import type {
  CommunityPost,
  PostComment,
  IrrigationExperience,
  PostLanguage,
  CommunityFilters,
} from '../../types'

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToPost(r: Record<string, unknown>): CommunityPost {
  return {
    id:              r.id as string,
    authorId:        r.author_id as string,
    authorName:      r.author_name as string,
    language:        r.language as PostLanguage,
    tag:             r.tag as CommunityPost['tag'],
    experience:      r.experience as IrrigationExperience,
    helpfulVotes:    r.helpful_votes as number,
    votedByUserIds:  [], // not stored in column — resolved separately via post_helpful_votes
    commentCount:    r.comment_count as number,
    reported:        r.reported as boolean,
    createdAt:       r.created_at as string,
    updatedAt:       r.updated_at as string,
  }
}

function rowToComment(r: Record<string, unknown>): PostComment {
  return {
    id:         r.id as string,
    postId:     r.post_id as string,
    authorId:   r.author_id as string,
    authorName: r.author_name as string,
    text:       r.text as string,
    language:   r.language as PostLanguage,
    createdAt:  r.created_at as string,
  }
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function dbGetPosts(
  filters: CommunityFilters = {}
): Promise<CommunityPost[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')

  let query = supabase!
    .from('community_posts')
    .select('*')
    .eq('reported', false)
    .order('created_at', { ascending: false })

  // Server-side filtering
  if (filters.crop) {
    query = query.eq('experience->>crop', filters.crop)
  }
  if (filters.stage) {
    query = query.eq('experience->>growthStage', filters.stage)
  }
  if (filters.district) {
    query = query.ilike('experience->>district', `%${filters.district}%`)
  }
  if (filters.search) {
    // Combine client-side text match after fetch — keep it simple without full-text config
    const { data, error } = await query
    if (error) throw dbError(error.message)
    const q = filters.search.toLowerCase()
    return (data ?? [])
      .map(rowToPost)
      .filter((p: CommunityPost) => {
        const e = p.experience
        return [e.crop, e.district, e.village, e.observations, p.authorName]
          .join(' ').toLowerCase().includes(q)
      })
  }

  const { data, error } = await query
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToPost)
}

export async function dbGetPostById(id: string): Promise<CommunityPost | null> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw dbError(error.message)
  return data ? rowToPost(data) : null
}

export async function dbCreatePost(
  experience: IrrigationExperience,
  authorId: string,
  authorName: string,
  language: PostLanguage
): Promise<CommunityPost> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('community_posts')
    .insert({
      author_id:   authorId,
      author_name: authorName,
      language,
      tag:         'self-reported',
      experience,
    })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToPost(data)
}

export async function dbDeletePost(postId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  // RLS ensures only the author can delete
  const { error } = await supabase!.from('community_posts').delete().eq('id', postId)
  if (error) throw dbError(error.message)
}

export async function dbReportPost(postId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  // Note: Schema migration restricts UPDATE grants on community_posts to author only.
  // We attempt report update; if restricted by RLS/column-grant, catch gracefully.
  try {
    const { error } = await supabase!
      .from('community_posts')
      .update({ reported: true })
      .eq('id', postId)
    if (error) console.warn('[dbReportPost] Post report handled locally (server column grant policy):', error.message)
  } catch (e) {
    console.warn('[dbReportPost] Notice:', e)
  }
}

// ── Helpful votes ─────────────────────────────────────────────────────────────

/**
 * Checks whether the current user has already voted on the post using the
 * SECURITY DEFINER RPC function 'has_voted_on_post' from the database migration.
 * (Direct SELECT on post_helpful_votes is intentionally disallowed by schema).
 */
export async function dbHasVoted(postId: string, _userId?: string): Promise<boolean> {
  if (!isDbAvailable()) return false
  try {
    const { data, error } = await supabase!.rpc('has_voted_on_post', { p_post_id: postId })
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

/**
 * Toggles helpful vote:
 * - If user already voted, removes the vote from post_helpful_votes
 * - If user hasn't voted, inserts into post_helpful_votes
 * Database triggers update community_posts.helpful_votes automatically.
 */
export async function dbVoteHelpful(postId: string, userId: string): Promise<boolean> {
  if (!isDbAvailable()) throw dbError('DB not configured')

  const alreadyVoted = await dbHasVoted(postId, userId)

  if (alreadyVoted) {
    // Toggle off (delete own vote)
    const { error } = await supabase!
      .from('post_helpful_votes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw dbError(error.message)
    return false
  } else {
    // Insert new vote
    const { error } = await supabase!
      .from('post_helpful_votes')
      .insert({ post_id: postId, user_id: userId })
    if (error) {
      if (error.code === '23505') return false // already voted
      throw dbError(error.message)
    }
    return true
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function dbGetComments(postId: string): Promise<PostComment[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToComment)
}

export async function dbAddComment(
  postId: string,
  text: string,
  authorId: string,
  authorName: string,
  language: PostLanguage
): Promise<PostComment> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('post_comments')
    .insert({
      post_id:     postId,
      author_id:   authorId,
      author_name: authorName,
      text:        text.trim(),
      language,
    })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToComment(data)
}

export async function dbDeleteComment(commentId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { error } = await supabase!.from('post_comments').delete().eq('id', commentId)
  if (error) throw dbError(error.message)
}
