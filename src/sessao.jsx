import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const Sessao = createContext(null)

export function ProvedorSessao({ children }) {
  const [sessao, setSessao] = useState(undefined)
  const [oficinaId, setOficinaId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessao) { setOficinaId(null); return }
    supabase
      .from('usuarios_oficina')
      .select('oficina_id')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setOficinaId(data?.oficina_id ?? null))
  }, [sessao])

  return (
    <Sessao.Provider value={{ sessao, oficinaId, sair: () => supabase.auth.signOut() }}>
      {children}
    </Sessao.Provider>
  )
}

export const useSessao = () => useContext(Sessao)
