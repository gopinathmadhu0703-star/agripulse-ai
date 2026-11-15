import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/** Protect app routes using the live Supabase Auth session. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F5]">
        <div className="text-sm text-[#687168]">Checking your session…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location, showSignIn: true }} />
  }

  return <Outlet />
}
