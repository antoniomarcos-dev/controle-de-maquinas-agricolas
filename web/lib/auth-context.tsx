'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) console.error("Error fetching profile:", error)
      if (data) setProfile(data as UserProfile)
    } catch (err) {
      console.error("Network error fetching profile:", err)
    }
  }

  useEffect(() => {
    let isMounted = true

    // Set a fail-safe timeout: if Supabase takes more than 3 seconds, force loading to false
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        if (!isMounted) return
        try {
          setSession(sess)
          setUser(sess?.user ?? null)
          if (sess?.user) {
            // Do not await here so we don't block the UI rendering
            fetchProfile(sess.user.id).catch(console.error)
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.error("Error in onAuthStateChange:", err)
        } finally {
          setLoading(false)
          clearTimeout(fallbackTimeout)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!isMounted) return
      setSession(sess)
      setUser(sess?.user ?? null)
      if (sess?.user) {
        fetchProfile(sess.user.id).catch(console.error)
      }
      setLoading(false)
      clearTimeout(fallbackTimeout)
    }).catch((err) => {
      console.error("Erro ao conectar no Supabase:", err)
      if (isMounted) setLoading(false)
      clearTimeout(fallbackTimeout)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(fallbackTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
