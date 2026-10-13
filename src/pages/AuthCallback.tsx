import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The actual OAuth callback is handled in AuthProvider
        // This component just shows loading and redirects
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Redirect to dashboard
        navigate('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <span className="text-3xl">🔐</span>
        </div>
        
        {isLoading ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authenticating with Google
            </h3>
            <p className="text-gray-500 mb-6">
              Please wait while we complete the authentication process...
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          </>
        ) : error ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}