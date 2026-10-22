import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useSessao } from '../sessao.jsx'
import { Carregando, reais, rotuloSituacao, tempoParado } from '../comum.jsx'

const VAZIO = {
  carros_no_patio: 0, dinheiro_parado: 0, media_dias_parado: 0,
  travados_nos: 0, travados_cliente: 0, abandonados: 0, em_andamento: 0,
}

export function Painel() {
  const { sair } = useSessao()
  const [painel, setPainel] = useState(undefined)
  const [top, setTop] = useState([])

  useEffect(() => {
    supabase.from('painel').select('*').maybeSingle().then(({ data }) => setPainel(data ?? VAZIO))
    supabase
      .from('veiculos_patio')
      .select('id, placa, modelo, cliente_nome, valor_a_receber, dias_restantes, pontuacao, cliente_responde, situacao')
      .in('situacao', ['nos', 'andamento'])
      .order('pontuacao', { ascending: false })
      .order('cliente_responde', { ascending: false })
      .limit(5)
      .then(({ data }) => setTop(data ?? []))
  }, [])

  if (painel === undefined) return <Carregando />
  const p = painel
  const travados = p.travados_nos + p.travados_cliente
  const pctNos = travados ? Math.round((p.travados_nos / travados) * 100) : 0

  return (
    <>
      <header className="topo">
        <div className="marca"><img src="/icone.svg" alt="" />Oficina</div>
        <button type="button" className="botao link" onClick={sair}>Sair</button>
      </header>

      <section className="numeros">
        <div className="numero">
          <strong>{p.carros_no_patio}</strong>
          <span>carros no pátio</span>
        </div>
        <div className="numero destaque">
          <strong>{reais(p.dinheiro_parado)}</strong>
          <span>a receber parado</span>
        </div>
        <div className="numero">
          <strong>{tempoParado(p.media_dias_parado) || '0 d'}</strong>
          <span>tempo médio parado</span>
        </div>
        <div className="numero">
          <strong>{p.travados_nos} <small>/ {p.travados_cliente}</small></strong>
          <span>por nós / pelo cliente</span>
          <div className="barra"><i style={{ width: `${pctNos}%` }} /></div>
        </div>
      </section>

      <div className="resumo">
        <span>Em andamento <b>{p.em_andamento}</b></span>
        <span>Abandonados <b>{p.abandonados}</b></span>
        <span>Peças investidas <b>{reais(p.pecas_investidas)}</b></span>
      </div>

      <h2>Atacar primeiro</h2>
      {top.length === 0 && (
        <div className="vazio">
          Nenhum carro travado por nós.<br />
          <Link to="/veiculo/novo">Cadastrar o primeiro carro</Link>
        </div>
      )}
      <ul className="lista">
        {top.map((v, i) => (
          <li key={v.id}>
            <Link to={`/veiculo/${v.id}`} className="cartao">
              <div className="cartao-linha">
                <span className="texto"><span className="posicao">{i + 1}</span><span className="placa">{v.placa}</span></span>
                <span className="direita valor">{reais(v.valor_a_receber)}</span>
              </div>
              <div className="cartao-linha">
                <span className="texto mudo">{v.modelo} · {v.cliente_nome}</span>
                <span className="direita mudo">{v.dias_restantes} d</span>
              </div>
              <div className="cartao-linha">
                <span className={`etiqueta ${v.situacao}`}>{rotuloSituacao(v.situacao)}</span>
                <span className="direita fraco" style={{ fontSize: 12 }}>{reais(v.pontuacao)}/dia</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {top.length > 0 && <Link to="/patio" className="botao leve ver-tudo">Ver pátio completo</Link>}
    </>
  )
}
