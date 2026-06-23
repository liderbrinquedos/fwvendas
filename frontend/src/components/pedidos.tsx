'use client'

import { useState, useMemo, useEffect } from 'react'
import { fmt, fmtN, whatsappLink } from '@/lib/utils'
import { erpApi } from '@/lib/erp-api'
import { useEmpresa } from '@/contexts/empresa-context'
import type { Produto, Cliente, Transportadora } from '@/lib/data-types'
import type { ERPPedido } from '@/lib/types-erp'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  ShoppingCart,
  Phone,
} from 'lucide-react'

/* ─── status badge ─── */
function statusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    pendente: ['bg-yellow-500/14 text-yellow-400', 'Pendente'],
    confirmado: ['bg-cyan-500/14 text-cyan-400', 'Confirmado'],
    em_separacao: ['bg-cyan-500/14 text-cyan-400', 'Em Separação'],
    faturado: ['bg-emerald-500/14 text-emerald-400', 'Faturado'],
    entregue: ['bg-emerald-500/14 text-emerald-400', 'Entregue'],
    cancelado: ['bg-red-500/14 text-red-400', 'Cancelado'],
  }
  const [cls, label] = map[status] || ['bg-gray-500/14 text-gray-400', status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-medium ${cls}`}>
      {label}
    </span>
  )
}

/* ─── props ─── */
interface PedidosProps {
  onOrderCreated?: () => void
  onOpenCart?: () => void
}

export default function Pedidos({ onOrderCreated, onOpenCart }: PedidosProps) {
  const { vendedor } = useEmpresa()

  /* ─── list state ─── */
  const [pedidos, setPedidos] = useState<ERPPedido[]>([])
  const [apiClientes, setApiClientes] = useState<Cliente[]>([])
  const [apiProdutos, setApiProdutos] = useState<Produto[]>([])
  const [apiTransportadoras, setApiTransportadoras] = useState<Transportadora[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  /* ─── load data from API ─── */
  useEffect(() => {
    Promise.all([
      erpApi.getPedidos(vendedor?.id, vendedor?.tipo),
      erpApi.getClientes(vendedor?.id, vendedor?.tipo),
      erpApi.getProdutos(),
      erpApi.getTransportadoras(),
    ]).then(([pedRes, cliRes, prodRes, transpRes]) => {
      setPedidos(pedRes.data)
      setApiClientes(cliRes.data)
      setApiProdutos(prodRes.data)
      setApiTransportadoras(transpRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [vendedor?.id, vendedor?.tipo])

  /* ─── detail modal ─── */
  const [detailPedido, setDetailPedido] = useState<ERPPedido | null>(null)

  /* ─── filtered list ─── */
  const filtered = useMemo(() => {
    let list = [...pedidos]
    if (statusFilter !== 'todos') {
      list = list.filter((p) => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        String(p.numero ?? p.id).toLowerCase().includes(q) ||
        (p.clienteNome ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [pedidos, search, statusFilter])

  /* ─── status filter buttons ─── */
  const statusFilters = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'confirmado', label: 'Confirmado' },
    { key: 'em_separacao', label: 'Em Separação' },
    { key: 'faturado', label: 'Faturado' },
    { key: 'cancelado', label: 'Cancelado' },
  ]

  /* ─── action handlers ─── */
  function handleConfirm(pedido: ERPPedido) {
    erpApi.updatePedidoStatus(pedido.id, 'confirmado').then(res => {
      setPedidos(prev => prev.map(p => p.id === pedido.id ? res.data : p))
    })
  }

  function handleCancel(pedido: ERPPedido) {
    erpApi.updatePedidoStatus(pedido.id, 'cancelado').then(res => {
      setPedidos(prev => prev.map(p => p.id === pedido.id ? res.data : p))
    })
  }

  function openWizard() {
    onOpenCart?.()
  }

  /* ─── render ─── */
  return (
    <div className="space-y-4">
      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Buscar pedido ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <Button
          onClick={openWizard}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold gap-2"
        >
          <Plus className="size-4" />
          Novo Pedido
        </Button>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setStatusFilter(sf.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === sf.key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {/* ── Order Table ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">Pedido</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Vendedor</th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Itens</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Pagamento</th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Data</th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-zinc-500">
                    <ShoppingCart className="size-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum pedido encontrado</p>
                  </td>
                </tr>
              ) : (
                filtered.map((pedido) => {
                  return (
                    <tr
                      key={pedido.id}
                      className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-amber-400 whitespace-nowrap">
                        {pedido.numero ?? pedido.id}
                      </td>
                      <td className="px-4 py-3 text-zinc-200 whitespace-nowrap">
                        {pedido.clienteNome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 hidden md:table-cell">
                        {pedido.vendedorNome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-300 hidden sm:table-cell">
                        {pedido.itens.length}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-200 font-medium whitespace-nowrap">
                        {fmt(pedido.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 hidden lg:table-cell">
                        {pedido.pagamento}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {statusBadge(pedido.status ?? 'pendente')}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                        {pedido.data}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailPedido(pedido)}
                            title="Visualizar"
                            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>
                          {pedido.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleConfirm(pedido)}
                                title="Confirmar"
                                className="p-1.5 rounded-md hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-colors"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(pedido)}
                                title="Cancelar"
                                className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{filtered.length} pedido(s) encontrado(s)</span>
        <span>
          Total:{' '}
          <span className="text-zinc-200 font-medium">
            {fmt(filtered.reduce((s, p) => s + p.valorTotal, 0))}
          </span>
        </span>
      </div>

      {/* ══════════════════════════════════════════════
          DETAIL MODAL
         ══════════════════════════════════════════════ */}
      <Dialog
        open={!!detailPedido}
        onOpenChange={(open) => !open && setDetailPedido(null)}
      >
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {detailPedido && (() => {
            const cli = apiClientes.find(c => c.id === detailPedido.clienteId)
            const transp = apiTransportadoras.find(t => t.id === detailPedido.transportadoraId)
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-amber-400">{detailPedido.numero ?? detailPedido.id}</span>
                    {statusBadge(detailPedido.status ?? 'pendente')}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    {detailPedido.data} &middot; Vendedor: {detailPedido.vendedorNome ?? '—'}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-2">
                  <div className="px-2 space-y-4">
                    {/* Client & Delivery */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold">Cliente</p>
                        <p className="text-sm font-medium text-zinc-200">{cli?.razaoSocial ?? '—'}</p>
                        <p className="text-xs text-zinc-400">{cli?.cnpj ?? ''}</p>
                        <p className="text-xs text-zinc-400">{cli?.cidade}/{cli?.uf}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold">Entrega</p>
                        <p className="text-sm text-zinc-200">{transp?.nome ?? '—'}</p>
                        <p className="text-xs text-zinc-400">Frete: {transp?.tipoFrete ?? '—'}</p>
                        <p className="text-xs text-zinc-400">Pagamento: {detailPedido.pagamento}</p>
                      </div>
                    </div>

                    <Separator className="bg-zinc-800" />

                    {/* Items Table */}
                    <div>
                      <p className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
                        Itens do Pedido
                      </p>
                      <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-800/60">
                              <th className="text-left px-3 py-2 text-zinc-400 font-medium">Produto</th>
                              <th className="text-center px-3 py-2 text-zinc-400 font-medium">Qtd</th>
                              <th className="text-right px-3 py-2 text-zinc-400 font-medium">Preço</th>
                              <th className="text-center px-3 py-2 text-zinc-400 font-medium">Desc%</th>
                              <th className="text-right px-3 py-2 text-zinc-400 font-medium">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailPedido.itens.map((item, idx) => (
                                <tr key={idx} className="border-t border-zinc-800/60">
                                  <td className="px-3 py-2 text-zinc-200">
                                    <span className="font-medium">{item.produtoNome ?? '—'}</span>
                                    {item.referencia && <span className="text-zinc-500 ml-1.5">({item.referencia})</span>}
                                  </td>
                                  <td className="px-3 py-2 text-center text-zinc-300">{fmtN(item.quantidade)}</td>
                                  <td className="px-3 py-2 text-right text-zinc-300">{fmt(item.valorUnitario)}</td>
                                  <td className="px-3 py-2 text-center text-zinc-300">
                                    {item.descontoPercentual > 0 ? `${item.descontoPercentual}%` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right text-zinc-200 font-medium">
                                    {fmt(item.valorTotal)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3">
                      <span className="text-sm text-zinc-400 font-medium">Total do Pedido</span>
                      <span className="text-lg font-bold text-amber-400">
                        {fmt(detailPedido.valorTotal)}
                      </span>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDetailPedido(null)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
