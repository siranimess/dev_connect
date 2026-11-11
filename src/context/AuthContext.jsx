import { createContext, useContext, useEffect, useState } from 'react'
import { configured, supabase } from '../lib/supabase'
import { demoUserId } from '../lib/demo'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function initialize() {
      setLoading(true)
      setError(null)
      try {
        if (!configured) {
          if (active) setUser({ id: demoUserId(), is_anonymous: true })
        } else {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          let authUser = sessionData.session?.user
          if (!authUser) {
            const { data, error: signInError } = await supabase.auth.signInAnonymously()
            if (signInError) throw signInError
            authUser = data.user
          }
          if (active) setUser(authUser)
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to connect to Supabase.')
      } finally {
        if (active) setLoading(false)
      }
    }
    initialize()
    return () => { active = false }
  }, [attempt])

  return <AuthContext.Provider value={{ user, loading, error, retry: () => setAttempt((n) => n + 1), demo: !configured }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
