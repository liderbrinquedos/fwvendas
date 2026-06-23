'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useCartStore, roundUpToMultiple, isValidMultiple } from '@/store/cart-store'
import { useBusinessRules } from '@/lib/business-rules'
import { fmt } from '@/lib/utils'
import { erpApi } from '@/lib/erp-api'
import { useEmpresa } from '@/contexts/empresa-context'
import type { ERPCliente, ERPTransportadora } from '@/lib/types-erp'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Tag,
  Truck,
  User,
  CreditCard,
  Zap,
  Package,
  Weight,
  Layers,
  AlertTriangle,
  Box,
  UserPlus,
  Check,
} from 'lucide-react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

type CheckoutStep = 'cart' | 'order'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderCreated?: () => void
}

export default function CartSheet({ open, onOpenChange, onOrderCreated }: CartSheetProps) {
  const { items, totalItems, totalValue, totalWeight, totalCubagem, removeItem, updateQuantity, incrementByMultiplo, decrementByMultiplo, setQuantityWithValidation, clearCart } = useCartStore()
  const { processCart } = useBusinessRules()

  const { vendedor } = useEmpresa()
  const [clientes, setClientes] = useState<ERPCliente[]>([])
  const [transportadoras, setTransportadoras] = useState<ERPTransportadora[]>([])

  useEffect(() => {
    if (vendedor) {
      erpApi.getClientes(vendedor.id, vendedor.tipo).then(res => {
        setClientes(res.data)
      }).catch(() => {})
    }
  }, [vendedor])

  useEffect(() => {
    erpApi.getTransportadoras().then(res => {
      setTransportadoras(res.data)
    }).catch(() => {})
  }, [])

  const handleCreateClient = useCallback(async (data: Partial<ERPCliente>): Promise<ERPCliente> => {
    const res = await erpApi.createCliente(data)
    setClientes((prev) => [...prev, res.data])
    return res.data
  }, [])

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedTransportadoraId, setSelectedTransportadoraId] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [freightCost, setFreightCost] = useState(150)
  const [freightType, setFreightType] = useState('CIF')
  const [orderError, setOrderError] = useState<string | null>(null)
  const [itemDiscounts, setItemDiscounts] = useState<Record<number, number>>({})
  const [produtos, setProdutos] = useState<{ id: number; nome: string; estoque: number }[]>([])
  const [regras, setRegras] = useState<{ validarEstoque: boolean; permitirVendaSemEstoque: boolean }>({ validarEstoque: true, permitirVendaSemEstoque: false })

  const resetOrderState = useCallback(() => {
    setCheckoutStep('cart')
    setSelectedClientId('')
    setSelectedTransportadoraId('')
    setSelectedPayment('')
    setOrderError(null)
    setItemDiscounts({})
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      resetOrderState()
      setOrderError(null)
    }
    onOpenChange(nextOpen)
  }, [onOpenChange, resetOrderState])

  const handleItemDiscountChange = useCallback((productId: number, discount: number) => {
    setItemDiscounts(prev => ({ ...prev, [productId]: discount }))
  }, [])

  useEffect(() => {
    erpApi.getProdutos().then(res => {
      setProdutos(res.data.map((p: { id: number; nome: string; estoque: number }) => ({ id: p.id, nome: p.nome, estoque: p.estoque })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    erpApi.getRegras().then(res => {
      if (res.data) {
        setRegras({
          validarEstoque: res.data.validarEstoque ?? true,
          permitirVendaSemEstoque: res.data.permitirVendaSemEstoque ?? false,
        })
      }
    }).catch(() => {})
  }, [])

  // Business rules engine result
  const engineResult = useMemo(() => {
    if (items.length === 0 || !selectedClientId) return null

    const client = clientes.find((c) => c.id === Number(selectedClientId))
    if (!client) return null

    const context = {
      cartItems: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        category: item.category,
        factoryId: item.factoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      customerId: client.id,
      customerData: {
        isVip: client.limiteCredito > 100000,
        city: client.cidade ?? '',
      },
      orderSubtotal: totalValue,
      paymentCondition: selectedPayment || '30 dias',
      freightType,
      freightCost,
    }

    return processCart(context)
  }, [items, selectedClientId, selectedPayment, totalValue, freightCost, freightType, processCart])

  const handleCreateOrder = async () => {
    if (!engineResult || !vendedor || !selectedClientId || !selectedTransportadoraId || !selectedPayment) return

    const estoqueErrors: string[] = []
    if (regras.validarEstoque && !regras.permitirVendaSemEstoque) {
      for (const item of items) {
        const prod = produtos.find(p => p.id === item.productId)
        if (prod && item.quantity > prod.estoque) {
          estoqueErrors.push(`${prod.nome} (disp: ${prod.estoque}, ped: ${item.quantity})`)
        }
      }
    }
    if (estoqueErrors.length > 0) {
      setOrderError(`Estoque insuficiente: ${estoqueErrors.join(', ')}`)
      return
    }

    const client = clientes.find((c) => c.id === Number(selectedClientId))

    const discountByProduct = new Map<number, number>()
    for (const rule of engineResult.appliedRules) {
      for (const alloc of rule.itemAllocations) {
        const existing = discountByProduct.get(alloc.productId) ?? 0
        discountByProduct.set(alloc.productId, existing + alloc.discountAmount)
      }
    }

    const itens = items.map((item) => {
      const total = item.quantity * item.unitPrice
      const engineDiscount = discountByProduct.get(item.productId) ?? 0
      const manualDiscountPct = itemDiscounts[item.productId] ?? 0
      const manualDiscount = total * (manualDiscountPct / 100)
      const desconto = engineDiscount + manualDiscount
      return {
        produtoId: item.productId,
        produtoNome: item.productName,
        referencia: item.productSku,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
        valorTotal: total - desconto,
        desconto,
        descontoPercentual: total > 0 ? (desconto / total) * 100 : 0,
      }
    })

    const valorTotal = itens.reduce((sum, i) => sum + i.valorTotal, 0)

    try {
      setOrderError(null)
      await erpApi.createPedido({
        clienteId: Number(selectedClientId),
        clienteNome: client?.nomeFantasia,
        vendedorId: vendedor.id,
        vendedorNome: vendedor.nome,
        transportadoraId: Number(selectedTransportadoraId),
        pagamento: selectedPayment,
        valorTotal,
        itens,
      })

      clearCart()
      resetOrderState()
      onOpenChange(false)
      onOrderCreated?.()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar pedido'
      console.error('Erro ao criar pedido:', error)
      setOrderError(msg)
    }
  }

  const activeClients = clientes.filter((c) => c.ativo)
  const activeTransportadoras = transportadoras.filter((t) => t.ativo)
  const paymentOptions = ['A vista', '30 dias', '30/60 dias', '30/60/90 dias', '30/60/90/120 dias']

  const isEmpty = items.length === 0

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="bg-[#0C0E14] border-[#252836] w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b border-[#252836]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-amber-400" />
            <SheetTitle className="text-amber-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {checkoutStep === 'cart' ? 'Carrinho' : 'Finalizar Pedido'}
            </SheetTitle>
          </div>
          <SheetDescription>
            {checkoutStep === 'cart'
              ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no carrinho`
              : 'Preencha os dados para criar o pedido'}
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="px-4 py-2 flex items-center justify-center gap-2 border-b border-[#252836]">
          <div className={`size-2.5 rounded-full ${checkoutStep === 'cart' ? 'bg-amber-400 scale-125' : 'bg-emerald-400'}`} />
          <div className={`h-0.5 w-10 ${checkoutStep === 'order' ? 'bg-gradient-to-r from-emerald-400 to-amber-400' : 'bg-[#252836]'}`} />
          <div className={`size-2.5 rounded-full ${checkoutStep === 'order' ? 'bg-amber-400 scale-125' : 'bg-[#252836]'}`} />
          <span className="ml-2 text-xs text-muted-foreground">
            {checkoutStep === 'cart' ? 'Itens' : 'Pedido'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {checkoutStep === 'cart' ? (
            <CartStep
              items={items}
              totalItems={totalItems}
              totalValue={totalValue}
              totalWeight={totalWeight}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
              onIncrement={incrementByMultiplo}
              onDecrement={decrementByMultiplo}
              onSetQuantity={setQuantityWithValidation}
              isEmpty={isEmpty}
              itemDiscounts={itemDiscounts}
              onDiscountChange={handleItemDiscountChange}
            />
          ) : (
            <OrderStep
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              selectedTransportadoraId={selectedTransportadoraId}
              setSelectedTransportadoraId={setSelectedTransportadoraId}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              activeClients={activeClients}
              activeTransportadoras={activeTransportadoras}
              paymentOptions={paymentOptions}
              engineResult={engineResult}
              totalValue={totalValue}
              onCreateClient={handleCreateClient}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#252836] bg-[#0C0E14]">
          {checkoutStep === 'cart' ? (
            <div className="space-y-3">
              {!isEmpty && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-bold text-amber-400">{fmt(totalValue)}</span>
                  </div>
                  {totalWeight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Weight className="size-3.5" /> Peso Total
                      </span>
                      <span className="text-sm font-medium text-zinc-300">
                        {totalWeight >= 1000
                          ? `${(totalWeight / 1000).toFixed(1)} t`
                          : `${totalWeight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`}
                      </span>
                    </div>
                  )}
                  {totalCubagem > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Box className="size-3.5" /> Cubagem Total
                      </span>
                      <span className="text-sm font-medium text-zinc-300">
                        {totalCubagem.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m³
                      </span>
                    </div>
                  )}
                </>
              )}
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-11"
                disabled={isEmpty}
                onClick={() => setCheckoutStep('order')}
              >
                Finalizar Pedido
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Total with rules applied */}
              {engineResult && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(engineResult.subtotal)}</span>
                  </div>
                  {engineResult.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Tag className="size-3" /> Desconto
                      </span>
                      <span className="text-emerald-400">-{fmt(engineResult.discount)}</span>
                    </div>
                  )}
                  {engineResult.freeShipping && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Truck className="size-3" /> Frete Grátis
                      </span>
                      <span className="text-emerald-400">R$ 0,00</span>
                    </div>
                  )}
                  <Separator className="bg-[#252836]" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-amber-400">{fmt(engineResult.finalTotal)}</span>
                  </div>
                </div>
              )}
              {orderError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#252836]"
                  onClick={() => setCheckoutStep('cart')}
                >
                  <ArrowLeft className="size-4" /> Voltar
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  disabled={!selectedClientId || !selectedTransportadoraId || !selectedPayment}
                  onClick={handleCreateOrder}
                >
                  <CheckCircle2 className="size-4" /> Criar Pedido
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================
// Cart Step
// ============================================================

function CartStep({
  items,
  totalItems,
  totalValue,
  totalWeight,
  onRemove,
  onUpdateQuantity,
  onIncrement,
  onDecrement,
  onSetQuantity,
  isEmpty,
  itemDiscounts,
  onDiscountChange,
}: {
  items: ReturnType<typeof useCartStore.getState>['items']
  totalItems: number
  totalValue: number
  totalWeight: number
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onSetQuantity: (productId: string, quantity: number) => { valid: boolean; roundedValue: number }
  isEmpty: boolean
  itemDiscounts: Record<number, number>
  onDiscountChange: (productId: number, discount: number) => void
}) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4">
        <div className="size-16 rounded-full bg-[#151820] flex items-center justify-center">
          <ShoppingCart className="size-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Carrinho vazio</p>
        <p className="text-muted-foreground/60 text-xs text-center">
          Adicione produtos ao carrinho para começar um pedido
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onSetQuantity={onSetQuantity}
          discount={itemDiscounts[item.productId] ?? 0}
          onDiscountChange={onDiscountChange}
        />
      ))}
    </div>
  )
}

// ============================================================
// Cart Item Card
// ============================================================

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
  onIncrement,
  onDecrement,
  onSetQuantity,
  discount,
  onDiscountChange,
}: {
  item: ReturnType<typeof useCartStore.getState>['items'][0]
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onSetQuantity: (productId: string, quantity: number) => { valid: boolean; roundedValue: number }
  discount: number
  onDiscountChange: (productId: number, discount: number) => void
}) {
  const multiplo = item.multiploVenda > 0 ? item.multiploVenda : item.qtdCaixa || 1
  const hasMultiplo = multiplo > 1
  const [editQty, setEditQty] = useState(() => String(item.quantity))
  const [showWarning, setShowWarning] = useState(false)
  const [lastKnownQty, setLastKnownQty] = useState(item.quantity)

  // Sync editQty when item.quantity changes externally (from +/- buttons)
  if (item.quantity !== lastKnownQty) {
    setEditQty(String(item.quantity))
    setShowWarning(false)
    setLastKnownQty(item.quantity)
  }

  function handleInputChange(value: string) {
    setEditQty(value)
    const numVal = parseInt(value) || 0
    if (numVal > 0 && !isValidMultiple(numVal, multiplo)) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }

  function handleInputBlur() {
    const numVal = parseInt(editQty) || 0
    if (numVal <= 0) {
      onRemove(String(item.productId))
      return
    }
    const result = onSetQuantity(String(item.productId), numVal)
    if (!result.valid) {
      // Show warning briefly then apply rounded value
      setShowWarning(true)
      setEditQty(String(result.roundedValue))
      setTimeout(() => {
        onUpdateQuantity(String(item.productId), result.roundedValue)
        setShowWarning(false)
      }, 800)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  const itemWeight = item.quantity * item.peso

  return (
    <div className="p-3 rounded-lg bg-[#151820] border border-[#252836] space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{item.productName}</p>
          <p className="text-xs text-muted-foreground">
            {item.productSku} · {item.category}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
          onClick={() => onRemove(String(item.productId))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Multiplo badge */}
      {hasMultiplo && (
        <div className="flex items-center gap-1.5 text-xs">
          <Layers className="size-3 text-amber-400" />
          <span className="text-amber-400 font-medium">Múltiplo: {multiplo}</span>
          <span className="text-muted-foreground">(incremento de {multiplo} em {multiplo})</span>
        </div>
      )}

      {/* Validation warning */}
      {showWarning && (
        <div className="flex items-center gap-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <AlertTriangle className="size-3 flex-shrink-0" />
          Quantidade ajustada para o múltiplo mais próximo
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-7 border-[#252836]"
            onClick={() => onDecrement(String(item.productId))}
            title={`Diminuir ${multiplo}`}
          >
            <Minus className="size-3" />
          </Button>
          <input
            type="number"
            value={editQty}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-16 text-center text-sm font-medium bg-[#0C0E14] border border-[#252836] rounded-md py-1 px-1 text-white outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={multiplo}
            step={multiplo}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7 border-[#252836]"
            onClick={() => onIncrement(String(item.productId))}
            title={`Aumentar ${multiplo}`}
          >
            <Plus className="size-3" />
          </Button>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} × {item.quantity}</p>
          <p className="text-sm font-semibold text-amber-400">{fmt(item.totalPrice)}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground">Desc:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => onDiscountChange(item.productId, Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-12 h-5 rounded bg-[#0C0E14] border border-[#252836] text-center text-[10px] text-zinc-200 outline-none focus:border-amber-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-muted-foreground">%</span>
          </div>
          {item.peso > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
              <Weight className="size-2.5" />
              {itemWeight >= 1000
                ? `${(itemWeight / 1000).toFixed(1)}t`
                : `${itemWeight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}kg`}
            </p>
          )}
          {item.metroCubico > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
              <Box className="size-2.5" />
              {(item.quantity * item.metroCubico).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m³
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Order Step
// ============================================================

function OrderStep({
  selectedClientId,
  setSelectedClientId,
  selectedTransportadoraId,
  setSelectedTransportadoraId,
  selectedPayment,
  setSelectedPayment,
  activeClients,
  activeTransportadoras,
  paymentOptions,
  engineResult,
  totalValue,
  onCreateClient,
}: {
  selectedClientId: string
  setSelectedClientId: (v: string) => void
  selectedTransportadoraId: string
  setSelectedTransportadoraId: (v: string) => void
  selectedPayment: string
  setSelectedPayment: (v: string) => void
  activeClients: ERPCliente[]
  activeTransportadoras: ERPTransportadora[]
  paymentOptions: string[]
  engineResult: ReturnType<typeof useBusinessRules>['processCart'] extends (...args: unknown[]) => infer R ? R : never
  totalValue: number
  onCreateClient: (data: Partial<ERPCliente>) => Promise<ERPCliente>
}) {
  const [clientOpen, setClientOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cidade: '',
    uf: '',
    telefone: '',
    email: '',
  })

  const selectedClient = activeClients.find((c) => c.id === Number(selectedClientId))

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return activeClients
    const q = clientSearch.toLowerCase()
    return activeClients.filter(
      (c) =>
        c.nomeFantasia?.toLowerCase().includes(q) ||
        c.razaoSocial?.toLowerCase().includes(q) ||
        c.cnpj?.includes(q)
    )
  }, [clientSearch, activeClients])

  function handleSelectClient(id: string) {
    setSelectedClientId(id)
    setClientOpen(false)
    setClientSearch('')
  }

  function handleCreateNewClient() {
    if (!newClientData.razaoSocial.trim()) return
    onCreateClient({
      razaoSocial: newClientData.razaoSocial.trim(),
      nomeFantasia: newClientData.nomeFantasia.trim() || undefined,
      cnpj: newClientData.cnpj.trim() || undefined,
      cidade: newClientData.cidade.trim() || undefined,
      uf: newClientData.uf.trim() || undefined,
      telefone: newClientData.telefone.trim() || undefined,
      email: newClientData.email.trim() || undefined,
      limiteCredito: 0,
      simplesNacional: false,
      ativo: true,
    }).then((newClient) => {
      setSelectedClientId(String(newClient.id))
      setShowNewClientForm(false)
      setClientOpen(false)
      setClientSearch('')
      setNewClientData({ razaoSocial: '', nomeFantasia: '', cnpj: '', cidade: '', uf: '', telefone: '', email: '' })
    })
  }

  return (
    <div className="p-4 space-y-5">
      {/* Client Selection */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
          <User className="size-3.5" /> Cliente
        </label>
        <Popover open={clientOpen} onOpenChange={setClientOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={clientOpen}
              className="flex h-10 w-full items-center justify-between rounded-md border border-[#252836] bg-[#151820] px-3 py-2 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedClient ? (
                <span className="truncate">{selectedClient.nomeFantasia || selectedClient.razaoSocial}</span>
              ) : (
                <span className="text-muted-foreground">Buscar cliente por nome ou CNPJ...</span>
              )}
              <Check className="ml-2 size-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#151820] border-[#252836]" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por nome, razao social ou CNPJ..."
                value={clientSearch}
                onValueChange={setClientSearch}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nenhum cliente encontrado{clientSearch ? ` para "${clientSearch}"` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewClientForm(true)
                        setNewClientData((prev) => ({ ...prev, razaoSocial: clientSearch }))
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <UserPlus className="size-3.5" />
                      Cadastrar novo cliente
                    </button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredClients.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={String(c.id)}
                      onSelect={() => handleSelectClient(String(c.id))}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{c.nomeFantasia}</span>
                        <span className="text-xs text-muted-foreground truncate">{c.razaoSocial}</span>
                        {c.cnpj && (
                          <span className="text-xs text-muted-foreground">{c.cnpj}{c.cidade && c.uf ? ` · ${c.cidade}/${c.uf}` : ''}</span>
                        )}
                      </div>
                      <Check className={`size-4 shrink-0 ${selectedClientId === String(c.id) ? 'text-amber-400 opacity-100' : 'opacity-0'}`} />
                    </CommandItem>
                  ))}
                  {!showNewClientForm && (
                    <CommandItem
                      value="__new_client__"
                      onSelect={() => {
                        setShowNewClientForm(true)
                        setNewClientData((prev) => ({ ...prev, razaoSocial: clientSearch }))
                      }}
                      className="cursor-pointer text-amber-400"
                    >
                      <UserPlus className="size-3.5 mr-1.5" />
                      <span className="text-sm">Cadastrar novo cliente</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Inline new client form */}
            {showNewClientForm && (
              <div className="border-t border-[#252836] p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-200">Novo Cliente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Razao Social *</label>
                    <input
                      value={newClientData.razaoSocial}
                      onChange={(e) => setNewClientData((p) => ({ ...p, razaoSocial: e.target.value }))}
                      placeholder="Razao social do cliente"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Nome Fantasia</label>
                    <input
                      value={newClientData.nomeFantasia}
                      onChange={(e) => setNewClientData((p) => ({ ...p, nomeFantasia: e.target.value }))}
                      placeholder="Nome fantasia"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">CNPJ</label>
                    <input
                      value={newClientData.cnpj}
                      onChange={(e) => setNewClientData((p) => ({ ...p, cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Cidade</label>
                    <input
                      value={newClientData.cidade}
                      onChange={(e) => setNewClientData((p) => ({ ...p, cidade: e.target.value }))}
                      placeholder="Cidade"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">UF</label>
                    <input
                      value={newClientData.uf}
                      onChange={(e) => setNewClientData((p) => ({ ...p, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                      placeholder="UF"
                      maxLength={2}
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Telefone</label>
                    <input
                      value={newClientData.telefone}
                      onChange={(e) => setNewClientData((p) => ({ ...p, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Email</label>
                    <input
                      value={newClientData.email}
                      onChange={(e) => setNewClientData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="email@cliente.com.br"
                      className="w-full h-9 rounded-md border border-[#252836] bg-[#0C0E14] px-3 text-sm text-zinc-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClientForm(false)
                      setNewClientData({ razaoSocial: '', nomeFantasia: '', cnpj: '', cidade: '', uf: '', telefone: '', email: '' })
                    }}
                    className="h-8 px-3 rounded-md border border-[#252836] text-zinc-300 hover:bg-[#151820] text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    disabled={!newClientData.razaoSocial.trim()}
                    className="h-8 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-zinc-900 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cadastrar e Selecionar
                  </button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {selectedClient && (
          <div className="text-xs text-muted-foreground pl-1">
            {selectedClient.cidade}/{selectedClient.uf} · Limite: {fmt(selectedClient.limiteCredito)}
            {selectedClient.limiteCredito > 100000 && (
              <Badge className="ml-2 badge-warning text-[10px] px-1.5 py-0">VIP</Badge>
            )}
          </div>
        )}
      </div>

      {/* Transportadora Selection */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
          <Truck className="size-3.5" /> Transportadora
        </label>
        <Select value={selectedTransportadoraId} onValueChange={setSelectedTransportadoraId}>
          <SelectTrigger className="bg-[#151820] border-[#252836] w-full">
            <SelectValue placeholder="Selecione a transportadora" />
          </SelectTrigger>
          <SelectContent className="bg-[#151820] border-[#252836]">
            {activeTransportadoras.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                <span>{t.nome}</span>
                <span className="text-muted-foreground ml-2 text-xs">({t.prazo})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payment Condition */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
          <CreditCard className="size-3.5" /> Condição de Pagamento
        </label>
        <Select value={selectedPayment} onValueChange={setSelectedPayment}>
          <SelectTrigger className="bg-[#151820] border-[#252836] w-full">
            <SelectValue placeholder="Selecione a condição" />
          </SelectTrigger>
          <SelectContent className="bg-[#151820] border-[#252836]">
            {paymentOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business Rules Results */}
      {engineResult && engineResult.appliedRules.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" /> Regras Aplicadas
          </label>
          <div className="space-y-1.5">
            {engineResult.appliedRules.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#151820] border border-[#252836]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {result.freeShipping ? (
                    <Truck className="size-3.5 text-emerald-400 flex-shrink-0" />
                  ) : result.discountTotal < 0 ? (
                    <Package className="size-3.5 text-red-400 flex-shrink-0" />
                  ) : (
                    <Tag className="size-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">{result.message}</span>
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ml-2 ${result.discountTotal > 0 ? 'text-emerald-400' : result.discountTotal < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {result.discountTotal > 0 ? `-${fmt(result.discountTotal)}` : result.discountTotal < 0 ? `${fmt(Math.abs(result.discountTotal))} ajuste` : 'Grátis'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Rules Applied */}
      {engineResult && engineResult.appliedRules.length === 0 && selectedClientId && (
        <div className="p-3 rounded-lg bg-[#151820] border border-[#252836] text-center">
          <p className="text-xs text-muted-foreground">Nenhuma regra de negócio aplicável para este pedido</p>
        </div>
      )}
    </div>
  )
}
