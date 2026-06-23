export interface ERPSyncResult {
  modulo: string
  registros: number
  status: string
  mensagem?: string
}

export interface ERPSyncStatus {
  is_syncing: boolean
  last_sync: string | null
  last_full_sync: string | null
  modules: Record<string, ERPSyncResult>
}

export interface ERPEnvelope<T> {
  success: boolean
  page?: number
  page_size?: number
  total: number
  data: T[]
}

export interface ERPCliente {
  id: number
  razaoSocial: string
  nomeFantasia?: string
  cnpj?: string
  ie?: string
  suframa?: string
  email?: string
  emailNfe?: string
  telefone?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  limiteCredito: number
  codigoVendedor?: number
  simplesNacional: boolean
  tipoParceiro?: string
  ativo: boolean
}

export interface ERPProduto {
  id: number
  codigo?: string
  referencia?: string
  nome: string
  unidade?: string
  ativo: boolean
  grupoId?: number
  categoria?: string
  ean?: string
  ncm?: string
  usoProd?: string
  statusProduto?: string
  precoBase: number
  estoque: number
  estoqueMin: number
  peso: number
  altura: number
  largura: number
  comprimento: number
  metroCubico: number
  qtdCaixa: number
  multiploVenda: number
  factoryId?: number
  factoryName?: string
}

export interface ERPPedidoItem {
  pedidoId: number
  sequencia?: number
  produtoId?: number
  produtoNome?: string
  referencia?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  desconto: number
  descontoPercentual: number
  pendente?: string
  controle?: string
}

export interface ERPPedido {
  id: number
  numero?: number
  clienteId?: number
  clienteNome?: string
  vendedorId?: number
  vendedorNome?: string
  transportadoraId?: number
  pagamento?: string
  data?: string
  valorTotal: number
  status?: string
  tipoOperacaoId?: number
  tipoOperacao?: string
  itens: ERPPedidoItem[]
}

export interface ERPVendedor {
  id: number
  nome: string
  tipo?: string
  gerenteId?: number
  ativo: boolean
  email?: string
}

export interface ERPTransportadora {
  id: number
  razaoSocial?: string
  nome: string
  cnpj?: string
  ie?: string
  tipoFrete?: string
  cep?: string
  telefone?: string
  email?: string
  perfil?: string
  regioes?: string
  prazo?: string
  ativo: boolean
}

export interface ERPCarteiraItem {
  id: number
  vendedorId: number
  vendedorNome?: string
  tipoVendedor?: string
  clienteId: number
  clienteNome?: string
}

export interface ERPRegraNegocio {
  id: number
  descontoMaximo: number
  pedidoMinimo: number
  bloqueioInadimplencia: boolean
  comissaoPadrao: number
  prazoMaximo: number
  validarEstoque: boolean
  permitirVendaSemEstoque: boolean
  nfAutomatica: boolean
  aprovarDescontoAcima: number
  pedidoMinimoRepresentante: number
  creditoAutomatico: boolean
  multiploVenda: boolean
}

export interface ERPSyncLogEntry {
  id: number
  modulo: string
  tipo: string
  registros: number
  status: string
  mensagem?: string
  createdAt: string
}

export interface ERPConnectionTest {
  ok: boolean
  latency?: number
  error?: string
}

export interface ERPEmpresa {
  id: number
  razaoSocial: string
  cnpj?: string
  cidade?: string
  uf?: string
  ativo: boolean
}

export type { BusinessRule } from './business-rules/types'

export interface ERPAuthResponse {
  success: boolean
  token?: string
  data: {
    vendedor: ERPVendedor
    empresas: ERPEmpresa[]
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
