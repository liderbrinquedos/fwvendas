import type {
  Cliente,
  Produto,
  Transportadora,
  Pedido,
  RegrasNegocio,
  ERPConfig,
  Vendedor,
} from './data-types'
import type { ERPPedido } from './types'

// Re-export utility functions from utils (single source of truth)
import { fmt, fmtN, whatsappLink, enderecoCompleto as fmtEndereco } from './utils'
export { fmt, fmtN, whatsappLink }

// Re-export enderecoCompleto that accepts a Cliente object
export function enderecoCompleto(c: Cliente): string {
  return fmtEndereco(c.logradouro || '', c.numero || '', c.complemento || '', c.bairro || '', c.cep || '')
}

// ========== MOCK DATA REMOVED (DB is now empty) ==========

export const DB = {
  produtos: [] as Produto[],
  clientes: [] as Cliente[],
  transportadoras: [] as Transportadora[],
  pedidos: [] as Pedido[],
  vendedores: [] as Vendedor[],
  regras: {} as RegrasNegocio,
  erp: {
    conexao: '',
    ultimaSinc: '',
    endpoint: '',
    apiKey: '',
    frequencia: '',
    logs: []
  } as ERPConfig,
}

// ========== STUBS FOR LEGACY FUNCTIONS ==========
// These functions previously depended on DB. Now they return empty/default values.
// Components should be updated to fetch data from the API instead.

/** Find a client by id (legacy stub) */
export function getCliente(id: number): Cliente | undefined {
  return undefined
}

/** Find a product by id (legacy stub) */
export function getProduto(id: number): Produto | undefined {
  return undefined
}

/** Find a carrier by id (legacy stub) */
export function getTransportadora(id: number): Transportadora | undefined {
  return undefined
}

/** Calculate order total with item-level discounts (legacy stub) */
export function calcPedidoTotal(p: Pedido | ERPPedido): number {
  // Prefer using actual order.total from backend if available
  return 0
}
