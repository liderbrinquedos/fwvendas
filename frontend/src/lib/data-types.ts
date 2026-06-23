import type {
  ERPCliente as Cliente,
  ERPProduto as Produto,
  ERPTransportadora as Transportadora,
  ERPPedido as Pedido,
  ERPRegraNegocio as RegrasNegocio,
  ERPVendedor as Vendedor,
} from './types'

export type { Cliente, Produto, Transportadora, Pedido, RegrasNegocio, Vendedor }

export interface ERPConfig {
  conexao: string
  ultimaSinc: string
  endpoint: string
  apiKey: string
  frequencia: string
  logs: Array<{
    hora: string
    tipo: string
    msg: string
    status: string
  }>
}

export type PageType = 'dashboard' | 'pedidos' | 'produtos' | 'clientes' | 'transportadoras' | 'regras' | 'erp'
