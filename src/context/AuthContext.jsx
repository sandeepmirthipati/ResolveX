import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/services/supabaseClient'
import { formatAuthError } from '@/utils/authError'
import { validatePhoneInput } from '@/utils/phone'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message || 'Failed to load user profile')
    }
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (error) {
        setAuthError(formatAuthError(error))
        setLoading(false)
        return
      }

      setSession(initialSession)
      if (initialSession?.user) {
        try {
          const profile = await fetchProfile(initialSession.user.id)
          setUser(profile)
          setAuthError(null)
        } catch (err) {
          setAuthError(formatAuthError(err))
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        try {
          const profile = await fetchProfile(newSession.user.id)
          setUser(profile)
          setAuthError(null)
        } catch (err) {
          setAuthError(formatAuthError(err))
          setUser(null)
        }
      } else {
        setUser(null)
        setAuthError(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(formatAuthError(error))

    const profile = await fetchProfile(data.user.id)
    if (!profile) {
      await signOut()
      throw new Error('Your profile was not found. Please contact support.')
    }
    if (profile.status === 'suspended') {
      await signOut()
      throw new Error('Your account has been suspended.')
    }

    setSession(data.session)
    setUser(profile)
    setAuthError(null)
    return { user: data.user, profile }
  }

  async function signUp(email, password, fullName, phone, role) {
    if (role === 'admin') {
      throw new Error('Admin accounts must be provisioned by an existing administrator.')
    }

const phoneCheck = validatePhoneInput(phone)
    if (!phoneCheck.valid) {
      throw new Error(phoneCheck.error)
    }

    const normalizedPhone = phoneCheck.normalized

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
          phone_number: normalizedPhone,
        },
      },
    })
    if (error) throw new Error(formatAuthError(error))

if (data.session?.user) {
      setSession(data.session)
      const profile = await fetchProfile(data.session.user.id)
      setUser(profile)
    }

    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(formatAuthError(error))
    setUser(null)
    setSession(null)
    setAuthError(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, authError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
