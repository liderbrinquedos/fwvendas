import { useCallback, useEffect } from 'react'
import {
  LayoutDashboard,
  Receipt,
  Package,
  Building2,
  Truck,
  SlidersHorizontal,
  Plug,
  ChevronsLeft,
  ChevronsRight,
  X,
  Zap,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app-store'
import type { PageType } from '@/lib/data-types'

interface NavItem {
  id: PageType
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const principalNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', path: '/pedidos', icon: Receipt },
  { id: 'produtos', label: 'Produtos', path: '/produtos', icon: Package },
  { id: 'clientes', label: 'Clientes', path: '/clientes', icon: Building2 },
  { id: 'transportadoras', label: 'Transportadoras', path: '/transportadoras', icon: Truck },
]

const configNavItems: NavItem[] = [
  { id: 'regras', label: 'Regras de Negócio', path: '/regras', icon: SlidersHorizontal },
  { id: 'erp', label: 'Integração ERP', path: '/erp', icon: Plug },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore()

  const handleNav = useCallback((path: string) => {
    navigate(path)
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false)
    }
  }, [navigate, mobileSidebarOpen, setMobileSidebarOpen])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileSidebarOpen, setMobileSidebarOpen])

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#0C0E14] border-r border-[#252836] z-50
          transition-all duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`h-[60px] flex items-center border-b border-[#252836] shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-[#0C0E14]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-sm text-white truncate">ForceVendas</h2>
                  <p className="text-[9px] text-[#6E7191]">Sistema de Vendas</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-[#0C0E14]" />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 text-[#6E7191] hover:text-white transition-colors"
            >
              {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 text-[#6E7191] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <p className="text-[10px] text-[#6E7191] uppercase tracking-wider font-semibold px-3 mb-2">Principal</p>
              )}
               {principalNavItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => handleNav(item.path)}
                   className={`
                     w-full flex items-center gap-3 rounded-lg transition-colors
                     ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                     ${location.pathname === item.path
                       ? 'bg-amber-500/14 text-amber-400'
                       : 'text-[#6E7191] hover:bg-[#1E2130] hover:text-white'
                     }
                   `}
                   title={sidebarCollapsed ? item.label : undefined}
                 >
                  <item.icon className="w-[18px] h-[18px]" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-1">
              {!sidebarCollapsed && (
                <p className="text-[10px] text-[#6E7191] uppercase tracking-wider font-semibold px-3 mb-2">Configurações</p>
              )}
               {configNavItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => handleNav(item.path)}
                   className={`
                     w-full flex items-center gap-3 rounded-lg transition-colors
                     ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                     ${location.pathname === item.path
                       ? 'bg-amber-500/14 text-amber-400'
                       : 'text-[#6E7191] hover:bg-[#1E2130] hover:text-white'
                     }
                   `}
                   title={sidebarCollapsed ? item.label : undefined}
                 >
                  <item.icon className="w-[18px] h-[18px]" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-[#252836]">
              <div className="text-[10px] text-[#6E7191] text-center">
                ForceVendas PRO v0.3.0
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
