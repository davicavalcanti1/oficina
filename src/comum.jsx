export const SITUACOES = [
  { valor: 'nos', rotulo: 'Travado por nós' },
  { valor: 'cliente', rotulo: 'Travado pelo cliente' },
  { valor: 'andamento', rotulo: 'Em andamento' },
  { valor: 'abandonado', rotulo: 'Abandonado' },
]

export const rotuloSituacao = (v) =>
  v === 'entregue' ? 'Entregue' : (SITUACOES.find((s) => s.valor === v)?.rotulo ?? v)

export const reais = (n) =>
  Number(n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function tempoParado(dias) {
  if (dias == null) return ''
  if (dias < 30) return `${dias} d`
  if (dias < 365) return `${Math.round(dias / 30)} meses`
  const anos = Math.floor(dias / 365)
  const meses = Math.round((dias % 365) / 30)
  return meses ? `${anos} a ${meses} m` : `${anos} a`
}

export function linkWhatsApp(telefone, texto) {
  const digitos = String(telefone ?? '').replace(/\D/g, '')
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export function mensagemCliente(v) {
  return `Olá ${v.cliente_nome}, aqui é da oficina. Sobre o ${v.modelo} placa ${v.placa}: ${v.falta}. Podemos seguir?`
}

export function Carregando() {
  return <p className="centro">Carregando…</p>
}
