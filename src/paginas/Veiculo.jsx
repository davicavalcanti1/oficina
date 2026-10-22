import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useSessao } from '../sessao.jsx'
import { Carregando, SITUACOES, linkWhatsApp, mensagemCliente, reais, rotuloSituacao } from '../comum.jsx'

const ANO_ATUAL = new Date().getFullYear()
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const VAZIO = {
  placa: '', modelo: '', cliente_nome: '', cliente_telefone: '', cliente_responde: true,
  entrada_ano: ANO_ATUAL, entrada_mes: '', servico_combinado: '', feito: '', falta: '',
  dias_restantes: 1, valor_pago: 0, valor_a_receber: 0, pecas_compradas: 0,
  situacao: 'nos', observacao: '',
}

export function Veiculo() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { oficinaId } = useSessao()
  const [v, setV] = useState(id ? undefined : VAZIO)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [entregando, setEntregando] = useState(false)
  const [valorEntrega, setValorEntrega] = useState('')
  const [salvo, setSalvo] = useState('')

  useEffect(() => {
    if (!id) { setV(VAZIO); return }
    supabase.from('veiculos').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { setErro('Carro não encontrado.'); setV(VAZIO); return }
      setV({ ...data, entrada_mes: data.entrada_mes ?? '', feito: data.feito ?? '', observacao: data.observacao ?? '' })
      setValorEntrega(String(data.valor_a_receber ?? ''))
    })
  }, [id])

  if (v === undefined) return <Carregando />

  const campo = (nome) => ({
    value: v[nome] ?? '',
    onChange: (e) => setV({ ...v, [nome]: e.target.value }),
  })

  const pontuacao = (Number(v.valor_a_receber) || 0) / Math.max(1, Number(v.dias_restantes) || 0)

  function montar() {
    return {
      oficina_id: oficinaId,
      placa: v.placa.trim().toUpperCase().replace(/\s+/g, ''),
      modelo: v.modelo.trim(),
      cliente_nome: v.cliente_nome.trim(),
      cliente_telefone: v.cliente_telefone.trim(),
      cliente_responde: !!v.cliente_responde,
      entrada_ano: Number(v.entrada_ano),
      entrada_mes: v.entrada_mes === '' ? null : Number(v.entrada_mes),
      servico_combinado: v.servico_combinado.trim(),
      feito: v.feito.trim() || null,
      falta: v.falta.trim(),
      dias_restantes: Math.max(0, Number(v.dias_restantes) || 0),
      valor_pago: Number(v.valor_pago) || 0,
      valor_a_receber: Number(v.valor_a_receber) || 0,
      pecas_compradas: Number(v.pecas_compradas) || 0,
      situacao: v.situacao,
      observacao: v.observacao.trim() || null,
    }
  }

  async function salvar(e) {
    e.preventDefault()
    if (!oficinaId) { setErro('Sua conta ainda não está ligada a uma oficina.'); return }
    setErro(''); setSalvo(''); setSalvando(true)
    const dados = montar()
    const { error } = id
      ? await supabase.from('veiculos').update(dados).eq('id', id)
      : await supabase.from('veiculos').insert(dados)
    setSalvando(false)
    if (error) {
      setErro(error.code === '23505' ? 'Já existe um carro com essa placa no pátio.' : error.message)
      return
    }
    if (id) { navegar('/patio', { replace: true }); return }
    setV({ ...VAZIO, entrada_ano: Number(v.entrada_ano) })
    setSalvo(`${dados.placa} cadastrado. Próximo carro.`)
    window.scrollTo(0, 0)
  }

  async function entregar() {
    setErro(''); setSalvando(true)
    const { error } = await supabase
      .from('veiculos')
      .update({
        situacao: 'entregue',
        entregue_em: new Date().toISOString().slice(0, 10),
        valor_recebido_entrega: Number(valorEntrega) || 0,
      })
      .eq('id', id)
    setSalvando(false)
    if (error) { setErro(error.message); return }
    navegar('/patio', { replace: true })
  }

  async function excluir() {
    if (!window.confirm(`Excluir ${v.placa}? Use só para cadastro errado. Carro que saiu da oficina é "entregue".`)) return
    setErro(''); setSalvando(true)
    const { error } = await supabase.from('veiculos').delete().eq('id', id)
    setSalvando(false)
    if (error) { setErro(error.message); return }
    navegar('/patio', { replace: true })
  }

  const entregue = v.situacao === 'entregue'

  return (
    <>
      <header className="topo">
        {id && <button type="button" className="botao link" onClick={() => navegar('/patio')}>Voltar</button>}
        <h1>{id ? <span className="placa" style={{ fontSize: 18 }}>{v.placa}</span> : 'Novo carro'}</h1>
        {id && !entregue && <span className={`etiqueta ${v.situacao}`}>{rotuloSituacao(v.situacao)}</span>}
      </header>

      {salvo && <p className="aviso">{salvo}</p>}
      {entregue && (
        <p className="aviso">Entregue em {v.entregue_em}. Recebido na entrega: {reais(v.valor_recebido_entrega)}.</p>
      )}

      <form onSubmit={salvar} className="form">
        <fieldset disabled={entregue || salvando}>
          <div className="secao">
            <h2>Carro</h2>
            <div className="secao-corpo">
              <div className="duas">
                <label>Placa
                  <input required autoCapitalize="characters" placeholder="ABC1D23" {...campo('placa')} />
                </label>
                <label>Modelo
                  <input required placeholder="Corolla 2015" {...campo('modelo')} />
                </label>
              </div>
              <div className="duas">
                <label>Ano de entrada
                  <input required type="number" inputMode="numeric" min="2000" max={ANO_ATUAL} {...campo('entrada_ano')} />
                </label>
                <label>Mês, se souber
                  <select {...campo('entrada_mes')}>
                    <option value="">Não sei</option>
                    {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="secao">
            <h2>Cliente</h2>
            <div className="secao-corpo">
              <div className="duas">
                <label>Nome
                  <input required {...campo('cliente_nome')} />
                </label>
                <label>Telefone
                  <input required type="tel" inputMode="tel" placeholder="83 99999 9999" {...campo('cliente_telefone')} />
                </label>
              </div>
              <label className="linha">
                <input type="checkbox" checked={!!v.cliente_responde} onChange={(e) => setV({ ...v, cliente_responde: e.target.checked })} />
                Responde quando chamado
              </label>
            </div>
          </div>

          <div className="secao">
            <h2>Serviço</h2>
            <div className="secao-corpo">
              <label>Serviço combinado
                <input required placeholder="Revisão do câmbio" {...campo('servico_combinado')} />
              </label>
              <label>O que já foi feito
                <textarea rows={2} {...campo('feito')} />
              </label>
              <label>O que falta
                <textarea rows={2} required placeholder="Montar e testar" {...campo('falta')} />
              </label>
              <label className="sufixo" data-sufixo="dias">Prazo para concluir
                <input required type="number" inputMode="numeric" min="0" {...campo('dias_restantes')} />
              </label>
            </div>
          </div>

          <div className="secao">
            <h2>Dinheiro</h2>
            <div className="secao-corpo">
              <div className="duas">
                <label className="prefixo">Cliente já pagou
                  <input required type="number" inputMode="decimal" min="0" step="0.01" {...campo('valor_pago')} />
                </label>
                <label className="prefixo">Falta receber
                  <input required type="number" inputMode="decimal" min="0" step="0.01" {...campo('valor_a_receber')} />
                </label>
              </div>
              <label className="prefixo">Peças já compradas pela oficina
                <input type="number" inputMode="decimal" min="0" step="0.01" {...campo('pecas_compradas')} />
              </label>
              <p className="dica-prioridade">Prioridade: <b>{reais(pontuacao)}</b> por dia de trabalho</p>
            </div>
          </div>

          <div className="secao">
            <h2>Situação</h2>
            <div className="secao-corpo">
              <div className="segmentos">
                {SITUACOES.map((s) => (
                  <button
                    type="button" key={s.valor}
                    className={`${s.valor}${v.situacao === s.valor ? ' ativa' : ''}`}
                    onClick={() => setV({ ...v, situacao: s.valor })}
                  >
                    {s.rotulo}
                  </button>
                ))}
              </div>
              <label>Observação
                <textarea rows={2} {...campo('observacao')} />
              </label>
            </div>
          </div>

          {erro && <p className="erro">{erro}</p>}

          <button className="botao primario" disabled={salvando}>
            {id ? 'Salvar' : 'Cadastrar e ir para o próximo'}
          </button>
        </fieldset>
      </form>

      {id && !entregue && (
        <section className="acoes">
          <a className="botao whats" href={linkWhatsApp(v.cliente_telefone, mensagemCliente(v))} target="_blank" rel="noreferrer">
            Chamar no WhatsApp
          </a>

          {!entregando ? (
            <button type="button" className="botao leve" onClick={() => setEntregando(true)}>Carro entregue</button>
          ) : (
            <div className="entrega">
              <label>Recebido na entrega (R$)
                <input type="number" inputMode="decimal" min="0" step="0.01" value={valorEntrega} onChange={(e) => setValorEntrega(e.target.value)} />
              </label>
              <button type="button" className="botao primario" onClick={entregar} disabled={salvando}>Confirmar entrega</button>
              <button type="button" className="botao link" onClick={() => setEntregando(false)}>Cancelar</button>
            </div>
          )}

          <button type="button" className="botao link excluir" onClick={excluir} disabled={salvando}>Excluir cadastro errado</button>
        </section>
      )}
    </>
  )
}
