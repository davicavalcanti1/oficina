import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { Carregando, linkWhatsApp, mensagemCliente, reais, rotuloSituacao, tempoParado } from '../comum.jsx'

const ABAS = [
  { chave: 'prioridade', rotulo: 'Prioridade', filtro: (v) => v.situacao === 'nos' || v.situacao === 'andamento' },
  { chave: 'cliente', rotulo: 'Cliente', filtro: (v) => v.situacao === 'cliente' },
  { chave: 'abandonado', rotulo: 'Abandonados', filtro: (v) => v.situacao === 'abandonado' },
  { chave: 'todos', rotulo: 'Todos', filtro: () => true },
]

export function Patio() {
  const [veiculos, setVeiculos] = useState(undefined)
  const [aba, setAba] = useState('prioridade')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    supabase
      .from('veiculos_patio')
      .select('*')
      .order('pontuacao', { ascending: false })
      .order('cliente_responde', { ascending: false })
      .then(({ data }) => setVeiculos(data ?? []))
  }, [])

  const contagens = useMemo(() => {
    const c = {}
    for (const a of ABAS) c[a.chave] = (veiculos ?? []).filter(a.filtro).length
    return c
  }, [veiculos])

  const filtrados = useMemo(() => {
    if (!veiculos) return []
    const termo = busca.trim().toLowerCase()
    const filtro = ABAS.find((a) => a.chave === aba).filtro
    return veiculos.filter((v) => {
      if (termo && !`${v.placa} ${v.modelo} ${v.cliente_nome}`.toLowerCase().includes(termo)) return false
      return filtro(v)
    })
  }, [veiculos, aba, busca])

  if (veiculos === undefined) return <Carregando />

  return (
    <>
      <header className="topo">
        <h1>Pátio<span className="contagem">{veiculos.length}</span></h1>
      </header>

      <input
        className="busca"
        placeholder="Placa, modelo ou cliente"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="abas">
        {ABAS.map((a) => (
          <button type="button" key={a.chave} className={aba === a.chave ? 'ativa' : ''} onClick={() => setAba(a.chave)}>
            {a.rotulo}<span className="n">{contagens[a.chave]}</span>
          </button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="vazio">
          {veiculos.length === 0
            ? <>O pátio está vazio no sistema.<br /><Link to="/veiculo/novo">Começar o censo</Link></>
            : 'Nada aqui.'}
        </div>
      )}

      <ul className="lista">
        {filtrados.map((v, i) => (
          <li key={v.id}>
            <Link to={`/veiculo/${v.id}`} className="cartao">
              <div className="cartao-linha">
                <span className="texto">
                  {aba === 'prioridade' && <span className="posicao">{i + 1}</span>}
                  <span className="placa">{v.placa}</span>
                </span>
                <span className="direita valor">{reais(v.valor_a_receber)}</span>
              </div>
              <div className="cartao-linha">
                <span className="texto mudo">{v.modelo} · {v.cliente_nome}</span>
                <span className="direita mudo">parado {tempoParado(v.dias_parado)}</span>
              </div>
              <div className="cartao-linha">
                <span className="texto falta">{v.falta}</span>
                {aba === 'todos'
                  ? <span className={`etiqueta ${v.situacao}`}>{rotuloSituacao(v.situacao)}</span>
                  : <span className="direita mudo">{v.dias_restantes} d restantes</span>}
              </div>
            </Link>
            {aba === 'cliente' && (
              <a className="botao whats" href={linkWhatsApp(v.cliente_telefone, mensagemCliente(v))} target="_blank" rel="noreferrer">
                Cobrar no WhatsApp
              </a>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
