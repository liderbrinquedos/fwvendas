import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { ERPVendedor, ERPEmpresa } from '@/lib/types'
import { setAuthToken } from '@/lib/api'

interface EmpresaContextType {
  vendedor: ERPVendedor | null
  empresas: ERPEmpresa[]
  empresa: ERPEmpresa | null
  login: (v: ERPVendedor, empresas: ERPEmpresa[], token: string) => void
  setEmpresa: (e: ERPEmpresa) => void
  logout: () => void
  loading: boolean
}

const EmpresaContext = createContext<EmpresaContextType>({
  vendedor: null,
  empresas: [],
  empresa: null,
  login: () => {},
  setEmpresa: () => {},
  logout: () => {},
  loading: false,
})

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [vendedor, setVendedor] = useState<ERPVendedor | null>(null)
  const [empresas, setEmpresas] = useState<ERPEmpresa[]>([])
  const [empresa, setEmpresa] = useState<ERPEmpresa | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('empresa-context')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.vendedor) setVendedor(parsed.vendedor)
        if (parsed.empresa) setEmpresa(parsed.empresa)
        if (parsed.empresas) setEmpresas(parsed.empresas)
        if (parsed.token) {
          setToken(parsed.token)
          setAuthToken(parsed.token)
        }
      } catch { /* ignore */ }
    }
  }, [])

  const login = useCallback((v: ERPVendedor, emps: ERPEmpresa[], tok: string) => {
    setVendedor(v)
    setEmpresas(emps)
    setEmpresa(emps.length === 1 ? emps[0] : null)
    setToken(tok)
    setAuthToken(tok)
  }, [])

  const handleSetEmpresa = useCallback((e: ERPEmpresa) => {
    setEmpresa(e)
  }, [])

  const logout = useCallback(() => {
    setVendedor(null)
    setEmpresa(null)
    setEmpresas([])
    setToken(null)
    setAuthToken(null)
    localStorage.removeItem('empresa-context')
  }, [])

  useEffect(() => {
    if (vendedor || empresa) {
      localStorage.setItem('empresa-context', JSON.stringify({ vendedor, empresa, empresas, token }))
    }
  }, [vendedor, empresa, empresas, token])

  return (
    <EmpresaContext.Provider value={{ vendedor, empresas, empresa, login, setEmpresa: handleSetEmpresa, logout, loading }}>
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  return useContext(EmpresaContext)
}
