import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { ALREADY_REGISTERED } from '@/lib/utils'

interface SignUpData {
  email: string
  password: string
  nombre: string
  apellido: string
  referral_code?: string
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  // `code` expone el código de error de Supabase (ej. 'email_not_confirmed') para
  // que Login pueda distinguir "mail sin confirmar" de "credenciales incorrectas".
  signIn: (email: string, password: string) => Promise<{ error: string | null; code: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  // `needsConfirmation` es true cuando el signUp no crea sesión inmediata (es decir,
  // "Confirm email" está activo y el usuario tiene que confirmar por mail antes de entrar).
  signUp: (data: SignUpData) => Promise<{ error: string | null; needsConfirmation: boolean }>
  // Reenvía el mail de confirmación de registro (supabase.auth.resend, type 'signup').
  resendConfirmation: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: string | null; code: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null, code: error?.code ?? null }
  }

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }

  const signUp = async ({ email, password, nombre, apellido, referral_code }: SignUpData): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    // El "tipo de vendedor" NO se pregunta más acá: lo define el onboarding
    // (paso 2) con su taxonomía granular. Evita pedir el mismo dato dos veces
    // con opciones distintas. Ver src/lib/taxonomy.ts.
    // emailRedirectTo: adónde vuelve el link de confirmación del mail. Con "Confirm
    // email" activo, el link pega en /auth/v1/verify de Supabase y redirige acá con
    // la sesión en el hash (flujo implícito) → AuthCallback la resuelve.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, referral_code: referral_code ?? null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) return { error: error.message, needsConfirmation: false }

    // Email ya registrado con "Confirm email" activo: Supabase no da error, devuelve
    // un user con identities vacío. Lo tratamos como "ya registrado".
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { error: ALREADY_REGISTERED, needsConfirmation: false }
    }

    // Sin sesión ⇒ hay que confirmar por mail. Con sesión ⇒ "Confirm email" está
    // apagado y el registro loguea directo (comportamiento previo, retrocompatible).
    return { error: null, needsConfirmation: !data.session }
  }

  const resendConfirmation = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, resendConfirmation, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
