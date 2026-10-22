import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useSessao } from './sessao.jsx'
import { Login } from './paginas/Login.jsx'
import { Painel } from './paginas/Painel.jsx'
import { Patio } from './paginas/Patio.jsx'
import { Veiculo } from './paginas/Veiculo.jsx'

const IconePainel = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></svg>
)
const IconePatio = () => (
  <svg viewBox="0 0 24 24"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><path d="M3 11h18v6H3z" /><path d="M6 17v2M18 17v2" /><circle cx="7.5" cy="14" r="1" /><circle cx="16.5" cy="14" r="1" /></svg>
)
const IconeMais = () => (
  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
)

export function App() {
  const { sessao } = useSessao()
  const local = useLocation()

  if (sessao === undefined) return <p className="centro mudo">Carregando…</p>
  if (!sessao) return <Login />

  const esconderNav = local.pathname.startsWith('/veiculo/') && local.pathname !== '/veiculo/novo'

  return (
    <>
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/patio" element={<Patio />} />
          <Route path="/veiculo/novo" element={<Veiculo />} />
          <Route path="/veiculo/:id" element={<Veiculo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!esconderNav && (
        <nav className="nav">
          <div className="nav-interno">
            <NavLink to="/" end><IconePainel />Painel</NavLink>
            <NavLink to="/veiculo/novo" className="nav-novo"><span className="mais"><IconeMais /></span>Carro</NavLink>
            <NavLink to="/patio"><IconePatio />Pátio</NavLink>
          </div>
        </nav>
      )}
    </>
  )
}
