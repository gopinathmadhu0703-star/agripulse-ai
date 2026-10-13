import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize Supabase client only if environment variables are present
let supabase: any = null

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url_here' && 
    supabaseAnonKey !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
}

export { supabase }

// Types for Supabase authentication
export interface SupabaseUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    picture?: string
    locale?: string
  }
  created_at: string
  email_confirmed_at?: string
}

// Helper to map Supabase user to our User type
export function mapSupabaseUser(supabaseUser: any): any {
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    picture: supabaseUser.user_metadata?.picture || null,
    locale: supabaseUser.user_metadata?.locale || 'en-US',
    emailVerified: !!supabaseUser.email_confirmed_at,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  }
}