import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Untyped accessor for writes. The hand-written Database types don't type
// insert/update/upsert (they resolve to `never`), so mutations use this while
// reads stay fully typed through `supabase`. Payloads are typed at the call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseWrite = supabase as any
