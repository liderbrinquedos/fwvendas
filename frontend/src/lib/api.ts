import type {
  ERPSyncResult, ERPSyncStatus, ERPEnvelope,
  ERPCliente, ERPProduto, ERPPedido, ERPVendedor,
  ERPTransportadora, ERPCarteiraItem, ERPRegraNegocio,
  ERPSyncLogEntry, ERPConnectionTest, ERPEmpresa,
  ERPAuthResponse, ApiError,
  BusinessRule
} from './types'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || ''

class ApiErrorImpl extends Error {
  statusCode?: number
  body?: unknown

  constructor(message: string, statusCode?: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.body = body
  }
}

let _token: string | null = null

export function setAuthToken(token: string | null) {
  _token = token
}

export function getAuthToken(): string | null {
  return _token
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`
  }
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { ...headers, ...options?.headers as Record<string, string> },
    ...options,
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = null
    }
    let message: string
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as Record<string, unknown>).detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail)) {
        message = detail
          .map((e: Record<string, unknown>) => `${(e.loc as string[])?.slice(1).join('.') ?? '?'}: ${e.msg ?? e.message ?? String(e)}`)
          .join(' | ')
      } else if (detail && typeof detail === 'object' && 'message' in detail) {
        const d = detail as Record<string, unknown>
        const parts = [String(d.message)]
        if (Array.isArray(d.errors) && d.errors.length > 0) {
          parts.push(
            ...(d.errors as Array<Record<string, string>>).map((e) => `${e.field}: ${e.message}`)
          )
        }
        message = parts.join(' | ')
      } else {
        message = String(detail)
      }
    } else {
      message = `Erro ${res.status}: ${res.statusText}`
    }
    throw new ApiErrorImpl(message, res.status, body)
  }

  return res.json() as Promise<T>
}

export const erpApi = {
  login(usuario: string, senha: string): Promise<ERPAuthResponse> {
    return request<ERPAuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ usuario, senha }) })
  },
  getEmpresaProdutos(empresaId: number): Promise<ERPEnvelope<ERPProduto>> {
    return request<ERPEnvelope<ERPProduto>>(`/api/v1/erp/empresas/${empresaId}/produtos`)
  },
  testConnection(): Promise<ERPConnectionTest> {
    return request<ERPConnectionTest>('/api/v1/erp/status')
  },

  syncModule(modulo: string): Promise<{ status: string; result: ERPSyncResult }> {
    return request<{ status: string; result: ERPSyncResult }>(`/api/v1/sync/${modulo}`, {
      method: 'POST',
    })
  },

  syncAll(): Promise<{ status: string; results: ERPSyncResult[] }> {
    return request<{ status: string; results: ERPSyncResult[] }>('/api/v1/sync/all', {
      method: 'POST',
    })
  },

  getSyncStatus(): Promise<ERPSyncStatus> {
    return request<ERPSyncStatus>('/api/v1/sync/status')
  },

  getClientes(vendedorId?: number, tipo?: string): Promise<ERPEnvelope<ERPCliente>> {
    const params = new URLSearchParams()
    if (vendedorId !== undefined) params.append('vendedor_id', String(vendedorId))
    if (tipo) params.append('tipo', tipo)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<ERPEnvelope<ERPCliente>>(`/api/v1/erp/clientes${query}`)
  },

  getProdutos(empresaId?: number): Promise<ERPEnvelope<ERPProduto>> {
    const params = new URLSearchParams()
    if (empresaId !== undefined) params.append('empresa_id', String(empresaId))
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<ERPEnvelope<ERPProduto>>(`/api/v1/erp/produtos${query}`)
  },

  getPedidos(vendedorId?: number, tipo?: string): Promise<ERPEnvelope<ERPPedido>> {
    const params = new URLSearchParams()
    if (vendedorId !== undefined) params.append('vendedor_id', String(vendedorId))
    if (tipo) params.append('tipo', tipo)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<ERPEnvelope<ERPPedido>>(`/api/v1/erp/pedidos${query}`)
  },

  getVendedores(): Promise<ERPEnvelope<ERPVendedor>> {
    return request<ERPEnvelope<ERPVendedor>>('/api/v1/erp/vendedores')
  },

  getTransportadoras(): Promise<ERPEnvelope<ERPTransportadora>> {
    return request<ERPEnvelope<ERPTransportadora>>('/api/v1/erp/transportadoras')
  },

  getCarteira(codvend?: number): Promise<ERPEnvelope<ERPCarteiraItem>> {
    const params = codvend ? `?codvend=${codvend}` : ''
    return request<ERPEnvelope<ERPCarteiraItem>>(`/api/v1/erp/carteira${params}`)
  },

  getRegras(): Promise<{ success: boolean; data: ERPRegraNegocio | null }> {
    return request<{ success: boolean; data: ERPRegraNegocio | null }>('/api/v1/erp/regras')
  },

  updateRegras(data: Partial<ERPRegraNegocio>): Promise<{ success: boolean; data: ERPRegraNegocio }> {
    return request<{ success: boolean; data: ERPRegraNegocio }>('/api/v1/erp/regras', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getSyncLogs(): Promise<ERPEnvelope<ERPSyncLogEntry>> {
    return request<ERPEnvelope<ERPSyncLogEntry>>('/api/v1/erp/sync-logs')
  },

  createProduto(data: Partial<ERPProduto>): Promise<{ success: boolean; data: ERPProduto }> {
    return request<{ success: boolean; data: ERPProduto }>('/api/v1/erp/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateProduto(id: number, data: Partial<ERPProduto>): Promise<{ success: boolean; data: ERPProduto }> {
    return request<{ success: boolean; data: ERPProduto }>(`/api/v1/erp/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteProduto(id: number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/v1/erp/produtos/${id}`, {
      method: 'DELETE',
    })
  },

  createCliente(data: Partial<ERPCliente>): Promise<{ success: boolean; data: ERPCliente }> {
    return request<{ success: boolean; data: ERPCliente }>('/api/v1/erp/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateCliente(id: number, data: Partial<ERPCliente>): Promise<{ success: boolean; data: ERPCliente }> {
    return request<{ success: boolean; data: ERPCliente }>(`/api/v1/erp/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteCliente(id: number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/v1/erp/clientes/${id}`, {
      method: 'DELETE',
    })
  },

  createTransportadora(data: Partial<ERPTransportadora>): Promise<{ success: boolean; data: ERPTransportadora }> {
    return request<{ success: boolean; data: ERPTransportadora }>('/api/v1/erp/transportadoras', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateTransportadora(id: number, data: Partial<ERPTransportadora>): Promise<{ success: boolean; data: ERPTransportadora }> {
    return request<{ success: boolean; data: ERPTransportadora }>(`/api/v1/erp/transportadoras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteTransportadora(id: number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/v1/erp/transportadoras/${id}`, {
      method: 'DELETE',
    })
  },

  createPedido(data: {
    clienteId: number;
    clienteNome?: string;
    vendedorId: number;
    vendedorNome?: string;
    transportadoraId?: number;
    pagamento?: string;
    valorTotal?: number;
    status?: string;
    itens?: Array<{
      produtoId: number;
      produtoNome: string;
      referencia?: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
      desconto?: number;
      descontoPercentual?: number;
    }>;
  }): Promise<{ success: boolean; data: ERPPedido }> {
    return request<{ success: boolean; data: ERPPedido }>('/api/v1/erp/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updatePedidoStatus(id: number, status: string): Promise<{ success: boolean; data: ERPPedido }> {
    return request<{ success: boolean; data: ERPPedido }>(`/api/v1/erp/pedidos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  getBusinessRules(): Promise<{ success: boolean; data: BusinessRule[] }> {
    return request<{ success: boolean; data: BusinessRule[] }>('/api/v1/erp/business-rules')
  },

  createBusinessRule(data: Partial<BusinessRule>): Promise<{ success: boolean; data: BusinessRule }> {
    return request<{ success: boolean; data: BusinessRule }>('/api/v1/erp/business-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateBusinessRule(id: string, data: Partial<BusinessRule>): Promise<{ success: boolean; data: BusinessRule }> {
    return request<{ success: boolean; data: BusinessRule }>(`/api/v1/erp/business-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteBusinessRule(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/v1/erp/business-rules/${id}`, {
      method: 'DELETE',
    })
  },

  toggleBusinessRule(id: string, enabled: boolean): Promise<{ success: boolean; data: BusinessRule }> {
    return request<{ success: boolean; data: BusinessRule }>(`/api/v1/erp/business-rules/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    })
  },

  getTiposNegociacao(): Promise<{ success: boolean; data: Array<{
    id: number;
    nome: string;
    ativo: boolean;
    parcelas: number;
    prazoMin: number;
    prazoMax: number;
    prazoMaxPriParcela: number;
    taxaJuro: number;
    basePrazo: string;
    vendaMin: number;
    vendaMax: number;
    descMax: number;
    percMinEntrada: number;
    statusTipo: string;
  }>; total: number }> {
    return request('/api/v1/erp/tipos-negociacao')
  },

  getTiposOperacao(): Promise<{ success: boolean; data: Array<{
    id: number;
    nome: string;
    tipoMovimento: string;
    ativo: boolean;
    statusOperacao: string;
  }>; total: number }> {
    return request('/api/v1/erp/tipos-operacao')
  },

  validatePedido(data: {
    clienteId: number;
    vendedorId: number;
    valorTotal: number;
    pagamento: string;
    itens: Array<{
      produtoId: number;
      produtoNome: string;
      referencia?: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
      desconto?: number;
      descontoPercentual?: number;
    }>;
  }): Promise<{
    success: boolean;
    valid: boolean;
    errors: Array<{ field: string; message: string; code: string }>;
    warnings: Array<{ field: string; message: string; code: string }>;
    engineResult: {
      subtotal: number;
      discount: number;
      commissionDiscount: number;
      freeShipping: boolean;
      appliedRules: Array<{
        ruleId: string;
        ruleName: string;
        ruleType: string;
        discountTotal: number;
        freeShipping: boolean;
        message: string;
      }>;
    };
  }> {
    return request<{
      success: boolean;
      valid: boolean;
      errors: Array<{ field: string; message: string; code: string }>;
      warnings: Array<{ field: string; message: string; code: string }>;
      engineResult: {
        subtotal: number;
        discount: number;
        commissionDiscount: number;
        freeShipping: boolean;
        appliedRules: Array<{
          ruleId: string;
          ruleName: string;
          ruleType: string;
          discountTotal: number;
          freeShipping: boolean;
          message: string;
        }>;
      };
    }>('/api/v1/erp/pedidos/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
} as const

export { ApiErrorImpl as ApiError }
export type {
  ERPSyncResult,
  ERPSyncStatus,
  ERPCliente,
  ERPProduto,
  ERPPedido,
  ERPVendedor,
  ERPTransportadora,
  ERPCarteiraItem,
  ERPRegraNegocio,
  ERPSyncLogEntry,
  ERPConnectionTest,
  ERPEmpresa,
  ERPAuthResponse,
  BusinessRule,
}
