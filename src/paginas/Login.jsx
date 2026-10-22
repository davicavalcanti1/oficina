import { useState } from 'react'
import { supabase } from '../supabase.js'

export function Login() {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [oficina, setOficina] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(''); setAviso(''); setOcupado(true)
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro('E-mail ou senha incorretos.')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password: senha,
        options: { data: { oficina_nome: oficina || 'Minha oficina' } },
      })
      if (error) setErro(error.message)
      else if (!data.session) setAviso('Conta criada. Confirme o e-mail que acabamos de enviar e depois entre.')
    }
    setOcupado(false)
  }

  return (
    <main className="conteudo login">
      <div className="marca"><img src="/icone.svg" alt="" />Oficina</div>
      <p className="mudo" style={{ margin: 0 }}>Censo do pátio e prioridade de serviço</p>
      <form onSubmit={enviar} className="form">
        {modo === 'criar' && (
          <label>Nome da oficina
            <input value={oficina} onChange={(e) => setOficina(e.target.value)} placeholder="Oficina do Zé" />
          </label>
        )}
        <label>E-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Senha
          <input type="password" required minLength={6} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && <p className="erro">{erro}</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        <button className="botao primario" disabled={ocupado}>
          {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
      <button type="button" className="botao link" onClick={() => setModo(modo === 'entrar' ? 'criar' : 'entrar')}>
        {modo === 'entrar' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
      </button>
    </main>
  )
}
