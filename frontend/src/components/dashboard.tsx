'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Ticket,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { fmt, fmtN } from '@/lib/utils'
import { erpApi } from '@/lib/erp-api'
 import type { Cliente, Produto } from '@/lib/types'
 import type { ERPPedido } from '@/lib/types-erp'
 import { useEmpresa } from '@/contexts/empresa-context'

// ===================== HELPERS =====================

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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cls}`}
    >
      {label}
    </span>
  )
}

// ===================== ANIMATION =====================

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' },
  }),
}

// ===================== CHART DATA =====================

const monthlySalesData = [
  { mes: 'Jul', valor: 185000 },
  { mes: 'Ago', valor: 210000 },
  { mes: 'Set', valor: 195000 },
  { mes: 'Out', valor: 230000 },
  { mes: 'Nov', valor: 258000 },
  { mes: 'Dez', valor: 287000 },
]

const CATEGORY_COLORS: Record<string, string> = {
  Cimento: '#F5A623',
  Aço: '#34D399',
  Cobertura: '#22D3EE',
  Alvenaria: '#F87171',
  Agregados: '#FBBF24',
  Hidráulica: '#A78BFA',
  Elétrica: '#FB923C',
  Acabamento: '#2DD4BF',
  Estrutural: '#E879F9',
}

// ===================== COMPONENT =====================

 export default function Dashboard() {
   const [clientes, setClientes] = useState<Cliente[]>([])
   const [produtos, setProdutos] = useState<Produto[]>([])
   const [pedidos, setPedidos] = useState<ERPPedido[]>([])
   const { empresa } = useEmpresa()

   useEffect(() => {
     Promise.all([
       erpApi.getClientes(),
       erpApi.getProdutos(empresa?.id),
       erpApi.getPedidos(),
     ]).then(([c, p, ped]) => {
       setClientes(c.data)
       setProdutos(p.data)
       setPedidos(ped.data)
     })
   }, [empresa])

   // ---- KPI computations ----
   const activeOrders = pedidos.filter((p) => p.status !== 'cancelado')

   const totalPedidos = pedidos.length

   const clientesAtivos = clientes.filter((c) => c.ativo).length

   // Calculate totals using product catalog
   const produtoMap = new Map<number, Produto>()
   produtos.forEach(p => produtoMap.set(p.id, p))

   const totalVendas = activeOrders.reduce((sum, p) => {
     return sum + p.itens.reduce((itemSum, item) => {
       const produto = produtoMap.get(item.produtoId)
       if (!produto) return itemSum
       // Use precoBase from product catalog
       const qtd = item.quantidade
       const descontoPercent = item.descontoPercentual || item.desconto || 0
       return itemSum + produto.precoBase * qtd * (1 - descontoPercent / 100)
     }, 0)
   }, 0)

   const ticketMedio = activeOrders.length > 0 ? totalVendas / activeOrders.length : 0

  // ---- Category chart data ----
  const categoryMap = new Map<string, number>()
  produtos.forEach((p) => {
    const val = p.estoque * p.precoBase
    categoryMap.set(p.categoria, (categoryMap.get(p.categoria) || 0) + val)
  })
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

   // ---- Top clients ----
   const clientTotals = new Map<number, number>()
   activeOrders.forEach((p) => {
     const orderTotal = p.itens.reduce((sum, item) => {
       const produto = produtoMap.get(item.produtoId)
       if (!produto) return sum
       const qtd = item.quantidade
       const descontoPercent = item.descontoPercentual || item.desconto || 0
       return sum + produto.precoBase * qtd * (1 - descontoPercent / 100)
     }, 0)
     clientTotals.set(p.clienteId!, (clientTotals.get(p.clienteId) || 0) + orderTotal)
   })

   const clientesMap = new Map(clientes.map(c => [c.id, c]))
   const topClients = Array.from(clientTotals.entries())
     .map(([id, total]) => {
       const c = clientesMap.get(id)
       return { id, nome: c?.nomeFantasia || c?.razaoSocial || 'Desconhecido', total }
     })
     .sort((a, b) => b.total - a.total)
     .slice(0, 5)

  // ---- Stock alerts ----
   const stockAlerts = produtos.filter((p) => p.estoque <= p.estoqueMin)

   // ---- Recent orders ----
   const recentOrders = [...pedidos]
     .filter(p => p.data)
     .sort((a, b) => b.data!.localeCompare(a.data!))
     .slice(0, 5)

   // ---- KPI card config ----
  const kpiCards = [
    {
      label: 'TOTAL VENDAS',
      value: fmt(totalVendas),
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-500/14',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: 'PEDIDOS',
      value: fmtN(totalPedidos),
      icon: ShoppingCart,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/14',
      trend: '+3 este mês',
      trendUp: true,
    },
    {
      label: 'CLIENTES ATIVOS',
      value: fmtN(clientesAtivos),
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/14',
      trend: `${fmtN(clientes.length)} total`,
      trendUp: true,
    },
    {
      label: 'TICKET MÉDIO',
      value: fmt(ticketMedio),
      icon: Ticket,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/14',
      trend: '-2.1%',
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ==================== KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-[#151820] border border-[#252836] rounded-xl p-5 hover:border-amber-500/25 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {card.label}
                </p>
                <p className="font-display font-bold text-2xl mt-1 text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bg} p-2.5 rounded-lg`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {card.trendUp ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  card.trendUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {card.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ==================== CHARTS ROW ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart - Vendas Mensais */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 bg-[#151820] border border-[#252836] rounded-xl p-5 hover:border-amber-500/25 transition-colors"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">
            Vendas Mensais
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
                <XAxis
                  dataKey="mes"
                  stroke="#6E7191"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6E7191"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    `${(v / 1000).toLocaleString('pt-BR')}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2130',
                    border: '1px solid #252836',
                    borderRadius: '0.5rem',
                    color: '#E4E5EA',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: number) => [fmt(value), 'Vendas']}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#F5A623"
                  strokeWidth={2.5}
                  dot={{ fill: '#F5A623', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#F5A623', stroke: '#0C0E14', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Doughnut Chart - Por Categoria */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-[#151820] border border-[#252836] rounded-xl p-5 hover:border-amber-500/25 transition-colors"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">
            Por Categoria
          </h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || '#6E7191'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2130',
                    border: '1px solid #252836',
                    borderRadius: '0.5rem',
                    color: '#E4E5EA',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: number) => [fmt(value), 'Estoque']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
            {categoryData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-sm shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[entry.name] || '#6E7191',
                  }}
                />
                <span className="text-[10.5px] text-muted-foreground">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ==================== BOTTOM ROW: TABLE + TOP CLIENTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders Table */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 bg-[#151820] border border-[#252836] rounded-xl p-5 hover:border-amber-500/25 transition-colors"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">
            Pedidos Recentes
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#252836]">
                  <th className="pb-3 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Pedido
                  </th>
                  <th className="pb-3 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Cliente
                  </th>
                  <th className="pb-3 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Total
                  </th>
                  <th className="pb-3 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Status
                  </th>
                  <th className="pb-3 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Data
                  </th>
                </tr>
              </thead>
               <tbody>
                 {recentOrders.map((order) => {
                   const cliente = clientesMap.get(order.clienteId!)
                   // Use order.valorTotal if available, else compute
                   const orderTotal = order.valorTotal || order.itens.reduce((sum, item) => {
                     const produto = produtoMap.get(item.produtoId)
                     if (!produto) return sum
                     const qtd = item.quantidade
                     const descontoPercent = item.descontoPercentual || item.desconto || 0
                     return sum + produto.precoBase * qtd * (1 - descontoPercent / 100)
                   }, 0)
                   return (
                     <tr
                       key={order.id}
                       className="border-b border-[#252836]/50 hover:bg-[#1E2130]/40 transition-colors"
                     >
                       <td className="py-3 text-sm font-medium text-foreground">
                         {order.numero}
                       </td>
                       <td className="py-3 text-sm text-muted-foreground">
                         {cliente?.nomeFantasia || '—'}
                       </td>
                       <td className="py-3 text-sm font-medium text-foreground">
                         {fmt(orderTotal)}
                       </td>
                       <td className="py-3">{statusBadge(order.status || '')}</td>
                       <td className="py-3 text-sm text-muted-foreground">
                         {order.data}
                       </td>
                     </tr>
                   )
                 })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Clients */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-[#151820] border border-[#252836] rounded-xl p-5 hover:border-amber-500/25 transition-colors"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">
            Top Clientes
          </h3>
          <div className="space-y-3">
            {topClients.map((client, idx) => {
              const maxTotal = topClients[0]?.total || 1
              const pct = (client.total / maxTotal) * 100
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {client.nome}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-amber-400">
                      {fmt(client.total)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1A1D2B] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ==================== STOCK ALERTS ==================== */}
      {stockAlerts.length > 0 && (
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-[#151820] border border-red-500/20 rounded-xl p-5 hover:border-red-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
            <h3 className="font-display font-bold text-sm text-red-400">
              Alertas de Estoque
            </h3>
            <span className="ml-auto bg-red-500/14 text-red-400 text-[10.5px] font-semibold px-2 py-0.5 rounded-full">
              {stockAlerts.length} {stockAlerts.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockAlerts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 bg-[#1A1D2B] rounded-lg p-3"
              >
                <div className="bg-red-500/14 p-2 rounded-lg shrink-0">
                  <Package className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.nome}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    Estoque:{' '}
                    <span className="text-red-400 font-semibold">
                      {fmtN(product.estoque)}
                    </span>{' '}
                    / Mín: {fmtN(product.estoqueMin)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
