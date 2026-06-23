import { BrowserRouter } from 'react-router-dom'
import { EmpresaProvider } from './contexts/empresa-context'
import { AppRoutes } from './routes'
import { Sidebar } from './components/sidebar'
import CartSheet from './components/cart-sheet'
import { useState, useCallback, useMemo } from 'react'
import { useCartStore } from './store/cart-store'
import { useEmpresa } from './contexts/empresa-context'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Bell, User, Building2, LogOut, ChevronDown, Check } from 'lucide-react'
import type { ERPEmpresa } from './lib/types'

function LoginView({ onLogin, onError }: { onLogin: (v: import('./lib/types').ERPVendedor, empresas: ERPEmpresa[], token: string) => void; onError: (msg: string) => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !senha) {
      setError('Preencha usuario e senha')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { erpApi } = await import('./lib/api')
      const res = await erpApi.login(usuario, senha)
      onLogin(res.data.vendedor, res.data.empresas, res.token || '')
    } catch (err) {
      if (err && typeof err === 'object' && 'statusCode' in err) {
        const apiErr = err as { statusCode?: number; message?: string }
        if (apiErr.statusCode === 401) {
          setError('Credenciais invalidas')
        } else if (apiErr.statusCode && apiErr.statusCode >= 500) {
          setError('Erro no servidor. Tente novamente.')
        } else if (!apiErr.statusCode) {
          setError('Erro de conexao. Verifique o servidor.')
        } else {
          setError(apiErr.message || 'Erro inesperado')
        }
      } else {
        setError('Erro de conexao. Verifique o servidor.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0C0E14] flex items-center justify-center p-6">
      <div className="fixed w-[500px] h-[500px] bg-amber-500 rounded-full -top-[200px] -left-[150px] opacity-[0.025] blur-[120px] pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] bg-cyan-500 rounded-full -bottom-[150px] -right-[100px] opacity-[0.025] blur-[120px] pointer-events-none" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">ForceVendas PRO</h1>
          <p className="text-sm text-[#6E7191] mt-1">Entre com suas credenciais</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#151820] border border-[#252836] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-xs mb-1.5 block">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Codigo do vendedor ou admin"
              className="w-full bg-[#0C0E14] border border-[#252836] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6E7191] outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1.5 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Sua senha"
              className="w-full bg-[#0C0E14] border border-[#252836] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6E7191] outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-[#0C0E14] hover:bg-amber-600 disabled:opacity-50 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EmpresaSelectView({ empresas, onSelect, onBackToLogin }: { empresas: ERPEmpresa[]; onSelect: (e: ERPEmpresa) => void; onBackToLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#0C0E14] flex items-center justify-center p-6">
      <div className="fixed w-[500px] h-[500px] bg-amber-500 rounded-full -top-[200px] -left-[150px] opacity-[0.025] blur-[120px] pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] bg-cyan-500 rounded-full -bottom-[150px] -right-[100px] opacity-[0.025] blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Selecionar Empresa</h1>
          <p className="text-sm text-[#6E7191] mt-1">Escolha a empresa para realizar a venda</p>
        </div>
        <div className="bg-[#151820] border border-[#252836] rounded-xl p-4 space-y-2">
          {empresas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6E7191] mb-4">Nenhuma empresa disponivel para este vendedor.</p>
              <button
                onClick={onBackToLogin}
                className="text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            empresas.map(e => (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-[#1E2130] transition-colors text-left border border-transparent hover:border-amber-500/20"
              >
                <div className="w-10 h-10 bg-amber-500/14 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{e.razaoSocial}</div>
                  <div className="text-[11px] text-[#6E7191]">{e.cidade}/{e.uf}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MainApp() {
  const { vendedor, empresas, empresa, setEmpresa, logout } = useEmpresa()
  const { totalItems } = useCartStore()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)
  const [empresaMenuOpen, setEmpresaMenuOpen] = useState(false)
  const empresaMenuRef = useState<HTMLDivElement | null>(null)[1]
  const location = useLocation()

  const pageMap: Record<string, [string, string]> = {
    '/': ['Dashboard', 'Visão geral do sistema'],
    '/pedidos': ['Pedidos', 'Gestão de pedidos de venda'],
    '/produtos': ['Produtos', 'Catálogo, estoque e dimensões'],
    '/clientes': ['Clientes', 'Cadastro e gestão'],
    '/transportadoras': ['Transportadoras', 'Cadastro de transportadoras'],
    '/regras': ['Regras de Negócio', 'Configuração de regras'],
    '/erp': ['Integração ERP', 'Conexão e sincronização'],
  }

  const pageInfo = pageMap[location.pathname] || ['Dashboard', 'Visão geral do sistema']
  const pageTitle = pageInfo[0]
  const pageSubtitle = pageInfo[1]

  const handleOrderCreated = useCallback(() => {
    navigate('/pedidos')
  }, [navigate])

  function handleSwitchEmpresa(e: ERPEmpresa) {
    setEmpresa(e)
    setEmpresaMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[#0C0E14]">
      <div className="fixed w-[500px] h-[500px] bg-amber-500 rounded-full -top-[200px] -left-[150px] opacity-[0.025] blur-[120px] pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] bg-cyan-500 rounded-full -bottom-[150px] -right-[100px] opacity-[0.025] blur-[120px] pointer-events-none" />
       <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ease-in-out md:ml-[260px]">
        <header className="h-[60px] bg-[#151820] border-b border-[#252836] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3.5">
            <div>
              <h1 className="font-display font-bold text-[17px] leading-tight text-white">{pageTitle}</h1>
              <p className="text-[11px] text-[#6E7191]">{pageSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            {empresa && empresas.length > 1 && (
              <div className="relative" ref={empresaMenuRef}>
                <button
                  onClick={() => setEmpresaMenuOpen(!empresaMenuOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/8 border border-amber-500/20 rounded-lg hover:border-amber-500/40 transition-colors"
                >
                  <Building2 size={12} className="text-amber-400" />
                  <span className="text-[11px] font-medium text-amber-300">{empresa.razaoSocial}</span>
                  <ChevronDown size={12} className={`text-amber-400 transition-transform ${empresaMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {empresaMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-[#151820] border border-[#252836] rounded-lg shadow-xl z-50 py-1">
                    <div className="px-3 py-2 border-b border-[#252836]">
                      <span className="text-[10px] text-[#6E7191] uppercase tracking-wider font-semibold">Trocar Empresa</span>
                    </div>
                    {empresas.map(e => (
                      <button
                        key={e.id}
                        onClick={() => handleSwitchEmpresa(e)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1E2130] transition-colors text-left ${e.id === empresa.id ? 'bg-amber-500/8' : ''}`}
                      >
                        <Building2 size={14} className={e.id === empresa.id ? 'text-amber-400' : 'text-zinc-500'} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${e.id === empresa.id ? 'text-amber-300 font-medium' : 'text-white'}`}>{e.razaoSocial}</div>
                          <div className="text-[10px] text-[#6E7191]">{e.id}</div>
                        </div>
                        {e.id === empresa.id && <Check size={14} className="text-amber-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {empresa && empresas.length <= 1 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                <Building2 size={12} className="text-amber-400" />
                <span className="text-[11px] font-medium text-amber-300">{empresa.razaoSocial}</span>
              </div>
            )}
            <button className="relative text-[#6E7191] hover:text-amber-400 transition-colors"
              onClick={() => setCartOpen(true)}>
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white">
                  {totalItems}
                </span>
              )}
            </button>
            <div className="relative cursor-pointer">
              <Bell size={15} className="text-[#6E7191]" />
              <div className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] bg-red-400 rounded-full" />
            </div>
            <div className="w-px h-[22px] bg-[#252836]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/14 rounded-lg flex items-center justify-center">
                <User size={12} className="text-amber-400" />
              </div>
              <div className="hidden md:block">
                <div className="text-[12.5px] font-semibold text-white">{vendedor?.nome || 'Vendedor'}</div>
                <div className="text-[9.5px] text-[#6E7191]">
                  {vendedor?.tipo === 'R' ? 'Representante' : vendedor?.tipo === 'V' ? 'Vendedor' : 'Gerente'}
                </div>
              </div>
              <button onClick={logout} className="ml-2 p-1.5 text-[#6E7191] hover:text-red-400 transition-colors" title="Trocar vendedor">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <AppRoutes />
        </main>
      </div>
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onOrderCreated={handleOrderCreated} />
      <div id="toast-container" className="fixed top-[18px] right-[18px] z-[200] flex flex-col gap-2" />
    </div>
  )
}

function AppInner() {
  const { vendedor, empresas, empresa, login, setEmpresa, logout } = useEmpresa()

  if (!vendedor) {
    return <LoginView onLogin={(v, emps, token) => login(v, emps, token)} onError={(msg) => console.error(msg)} />
  }

  if (!empresa) {
    return <EmpresaSelectView empresas={empresas} onSelect={e => setEmpresa(e)} onBackToLogin={logout} />
  }

  return <MainApp />
}

export default function App() {
  return (
    <BrowserRouter>
      <EmpresaProvider>
        <AppInner />
      </EmpresaProvider>
    </BrowserRouter>
  )
}
