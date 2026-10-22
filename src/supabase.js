import { createClient } from '@supabase/supabase-js'

// Em produção (Docker) a configuração vem de /config.js, gerado na subida do container.
// Em desenvolvimento vem do .env.
const config = window.__CONFIG__ ?? {}
const url = config.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const key = config.SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  throw new Error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_KEY.')
}

export const supabase = createClient(url, key)
