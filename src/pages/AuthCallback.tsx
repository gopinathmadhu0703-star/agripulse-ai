import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        navigate('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsLoading(false)
      }
    }
    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F5]">
      <div className="text-center max-w-sm p-8 bg-white rounded-lg shadow-card border border-[#E0E5DD]">
        {isLoading ? (
          <>
            <div className="w-10 h-10 rounded-full bg-[#EAF0E6] flex items-center justify-center mx-auto mb-4">
              <Loader2 size={18} className="text-[#527A45] animate-spin" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">
              Authenticating with Google
            </h3>
            <p className="text-xs text-[#9AA49A]">
              Please wait while we complete the sign-in process…
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">Authentication Failed</h3>
            <p className="text-xs text-[#9AA49A] mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#24452D] text-white text-sm font-medium rounded-md hover:bg-[#1c3622] transition-colors"
            >
              Return to Home
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
