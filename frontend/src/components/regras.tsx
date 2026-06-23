'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { fmt } from '@/lib/utils'
import type { RegrasNegocio } from '@/lib/data-types'
import { erpApi } from '@/lib/erp-api'
import { useBusinessRules } from '@/lib/business-rules'
import type { BusinessRule, RuleType, RulePriority, DiscountType, ProgressiveTier } from '@/lib/business-rules'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  Percent,
  ShoppingCart,
  Package,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  AlertTriangle,
  Star,
} from 'lucide-react'

// ============================================================
// Simple Rules Section
// ============================================================

function SimpleRulesSection({ regras, onUpdate }: { regras: RegrasNegocio; onUpdate: (r: RegrasNegocio) => void }) {
  const update = <K extends keyof RegrasNegocio>(key: K, value: RegrasNegocio[K]) => {
    onUpdate({ ...regras, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-amber-400" />
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Regras de Negócio
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Desconto e Preço */}
        <Card className="bg-[#151820] border-[#252836]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="size-4 text-amber-400" />
              Desconto e Preço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Desconto Máximo (%)</label>
                <span className="text-sm font-semibold text-amber-400">{regras.descontoMaximo}%</span>
              </div>
              <Slider
                value={[regras.descontoMaximo]}
                onValueChange={([v]) => update('descontoMaximo', v)}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Aprovar Desconto Acima (%)</label>
                <span className="text-sm font-semibold text-amber-400">{regras.aprovarDescontoAcima}%</span>
              </div>
              <Slider
                value={[regras.aprovarDescontoAcima]}
                onValueChange={([v]) => update('aprovarDescontoAcima', v)}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Comissão Padrão (%)</label>
              <Input
                type="number"
                value={regras.comissaoPadrao}
                onChange={(e) => update('comissaoPadrao', Number(e.target.value))}
                className="bg-[#0C0E14] border-[#252836] h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pedido */}
        <Card className="bg-[#151820] border-[#252836]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="size-4 text-amber-400" />
              Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Pedido Mínimo (R$)</label>
              <Input
                type="number"
                value={regras.pedidoMinimo}
                onChange={(e) => update('pedidoMinimo', Number(e.target.value))}
                className="bg-[#0C0E14] border-[#252836] h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Pedido Mínimo Representante (R$)</label>
              <Input
                type="number"
                value={regras.pedidoMinimoRepresentante}
                onChange={(e) => update('pedidoMinimoRepresentante', Number(e.target.value))}
                className="bg-[#0C0E14] border-[#252836] h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Prazo Máximo (dias)</label>
              <Input
                type="number"
                value={regras.prazoMaximo}
                onChange={(e) => update('prazoMaximo', Number(e.target.value))}
                className="bg-[#0C0E14] border-[#252836] h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estoque e Faturamento */}
        <Card className="bg-[#151820] border-[#252836]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="size-4 text-amber-400" />
              Estoque e Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Validar Estoque</label>
              <Switch
                checked={regras.validarEstoque}
                onCheckedChange={(v) => update('validarEstoque', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Permitir Venda Sem Estoque</label>
              <Switch
                checked={regras.permitirVendaSemEstoque}
                onCheckedChange={(v) => update('permitirVendaSemEstoque', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">NF Automática</label>
              <Switch
                checked={regras.nfAutomatica}
                onCheckedChange={(v) => update('nfAutomatica', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Crédito e Bloqueio */}
        <Card className="bg-[#151820] border-[#252836]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="size-4 text-amber-400" />
              Crédito e Bloqueio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Bloqueio por Inadimplência</label>
              <Switch
                checked={regras.bloqueioInadimplencia}
                onCheckedChange={(v) => update('bloqueioInadimplencia', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Crédito Automático</label>
              <Switch
                checked={regras.creditoAutomatico}
                onCheckedChange={(v) => update('creditoAutomatico', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Múltiplo de Venda</label>
              <Switch
                checked={regras.multiploVenda}
                onCheckedChange={(v) => update('multiploVenda', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Advanced Rules Engine Section
// ============================================================

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  PROMOTIONAL: 'Promoção',
  QUANTITY_THRESHOLD: 'Qtd. Mínima',
  VALUE_THRESHOLD: 'Valor Mínimo',
  FREE_SHIPPING: 'Frete Grátis',
  MAX_DISCOUNT: 'Desconto Máx.',
  CASH_DISCOUNT: 'Desconto à Vista',
  PROGRESSIVE: 'Progressivo',
  CUSTOMER_VIP: 'Cliente VIP',
  CATEGORY_PROMO: 'Promo Categoria',
  COMMISSION_DISCOUNT: 'Desc. Comissão',
  COMBO_PRODUCTS: 'Combo Produtos',
}

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  PROMOTIONAL: 'badge-info',
  QUANTITY_THRESHOLD: 'badge-warning',
  VALUE_THRESHOLD: 'badge-warning',
  FREE_SHIPPING: 'badge-success',
  MAX_DISCOUNT: 'badge-danger',
  CASH_DISCOUNT: 'badge-info',
  PROGRESSIVE: 'badge-info',
  CUSTOMER_VIP: 'badge-warning',
  CATEGORY_PROMO: 'badge-info',
  COMMISSION_DISCOUNT: 'badge-muted',
  COMBO_PRODUCTS: 'badge-success',
}

const PRIORITY_CONFIG: Record<RulePriority, { label: string; color: string; icon: React.ReactNode }> = {
  CRITICAL: { label: 'Crítica', color: 'badge-danger', icon: <AlertTriangle className="size-3" /> },
  HIGH: { label: 'Alta', color: 'badge-warning', icon: <Star className="size-3" /> },
  MEDIUM: { label: 'Média', color: 'badge-info', icon: <Zap className="size-3" /> },
  LOW: { label: 'Baixa', color: 'badge-muted', icon: <Clock className="size-3" /> },
}

function createEmptyRule(): BusinessRule {
  return {
    id: `rule-${Date.now()}`,
    name: '',
    description: '',
    type: 'PROMOTIONAL',
    enabled: true,
    priority: 'MEDIUM',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  }
}

function RuleFormDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: BusinessRule | null
  onSave: (rule: BusinessRule) => void
}) {
  const [form, setForm] = useState<BusinessRule>(createEmptyRule)
  const [tiers, setTiers] = useState<ProgressiveTier[]>([])

  const isNew = !rule

  // When dialog opens, populate form with rule data or empty
  useEffect(() => {
    if (open) {
      if (rule) {
        setForm({ ...rule })
        setTiers(rule.progressiveTiers || [])
      } else {
        setForm(createEmptyRule())
        setTiers([])
      }
    }
  }, [open, rule])

  const updateForm = <K extends keyof BusinessRule>(key: K, value: BusinessRule[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const saved: BusinessRule = {
      ...form,
      progressiveTiers: form.type === 'PROGRESSIVE' ? tiers : undefined,
      freeShippingThreshold: form.type === 'FREE_SHIPPING' ? form.freeShippingThreshold : undefined,
      updatedAt: new Date().toISOString(),
    }
    if (!saved.createdAt) saved.createdAt = new Date().toISOString()
    onSave(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151820] border-[#252836] max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-amber-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isNew ? 'Nova Regra' : 'Editar Regra'}
          </DialogTitle>
          <DialogDescription>
            Configure as condições e ações desta regra de negócio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Informações Básicas</h4>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Nome da regra"
                className="bg-[#0C0E14] border-[#252836]"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
              <Input
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Descrição da regra"
                className="bg-[#0C0E14] border-[#252836]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tipo</label>
                <Select value={form.type} onValueChange={(v) => updateForm('type', v as RuleType)}>
                  <SelectTrigger className="bg-[#0C0E14] border-[#252836] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151820] border-[#252836]">
                    {Object.entries(RULE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Prioridade</label>
                <Select value={form.priority} onValueChange={(v) => updateForm('priority', v as RulePriority)}>
                  <SelectTrigger className="bg-[#0C0E14] border-[#252836] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151820] border-[#252836]">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => updateForm('enabled', v)} />
              <label className="text-sm">{form.enabled ? 'Regra Ativa' : 'Regra Inativa'}</label>
            </div>
          </div>

          <Separator className="bg-[#252836]" />

          {/* Conditions */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Condições</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Filtro Categoria</label>
                <Input
                  value={form.productFilter?.category || ''}
                  onChange={(e) =>
                    updateForm('productFilter', { ...form.productFilter, category: e.target.value || undefined })
                  }
                  placeholder="Ex: Cimento"
                  className="bg-[#0C0E14] border-[#252836]"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cidade do Cliente</label>
                <Input
                  value={form.customerFilter?.city || ''}
                  onChange={(e) =>
                    updateForm('customerFilter', { ...form.customerFilter, city: e.target.value || undefined })
                  }
                  placeholder="Ex: São Paulo"
                  className="bg-[#0C0E14] border-[#252836]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Pedido Mínimo (R$)</label>
                <Input
                  type="number"
                  value={form.minOrderValue || ''}
                  onChange={(e) => updateForm('minOrderValue', Number(e.target.value) || undefined)}
                  placeholder="0"
                  className="bg-[#0C0E14] border-[#252836]"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Qtd. Mínima Pedido</label>
                <Input
                  type="number"
                  value={form.minOrderQuantity || ''}
                  onChange={(e) => updateForm('minOrderQuantity', Number(e.target.value) || undefined)}
                  placeholder="0"
                  className="bg-[#0C0E14] border-[#252836]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.customerFilter?.isVip || false}
                onCheckedChange={(v) =>
                  updateForm('customerFilter', { ...form.customerFilter, isVip: v || undefined })
                }
              />
              <label className="text-sm">Somente clientes VIP</label>
            </div>
          </div>

          <Separator className="bg-[#252836]" />

          {/* Discount */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Desconto</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tipo de Desconto</label>
                <Select value={form.discountType} onValueChange={(v) => updateForm('discountType', v as DiscountType)}>
                  <SelectTrigger className="bg-[#0C0E14] border-[#252836] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151820] border-[#252836]">
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor do Desconto</label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => updateForm('discountValue', Number(e.target.value))}
                  className="bg-[#0C0E14] border-[#252836]"
                />
              </div>
            </div>
          </div>

          {/* Progressive Tiers */}
          {form.type === 'PROGRESSIVE' && (
            <>
              <Separator className="bg-[#252836]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Faixas Progressivas</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#252836] text-amber-400 hover:bg-amber-400/10"
                    onClick={() => setTiers((prev) => [...prev, { threshold: 0, discountValue: 0 }])}
                  >
                    <Plus className="size-3" /> Faixa
                  </Button>
                </div>
                {tiers.map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Qtd. Mínima</label>
                      <Input
                        type="number"
                        value={tier.threshold}
                        onChange={(e) => {
                          const newTiers = [...tiers]
                          newTiers[idx] = { ...newTiers[idx], threshold: Number(e.target.value) }
                          setTiers(newTiers)
                        }}
                        className="bg-[#0C0E14] border-[#252836]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Desconto (%)</label>
                      <Input
                        type="number"
                        value={tier.discountValue}
                        onChange={(e) => {
                          const newTiers = [...tiers]
                          newTiers[idx] = { ...newTiers[idx], discountValue: Number(e.target.value) }
                          setTiers(newTiers)
                        }}
                        className="bg-[#0C0E14] border-[#252836]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-400/10"
                      onClick={() => setTiers((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Free Shipping Threshold */}
          {form.type === 'FREE_SHIPPING' && (
            <>
              <Separator className="bg-[#252836]" />
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Frete Grátis</h4>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Valor Mínimo para Frete Grátis (R$)</label>
                  <Input
                    type="number"
                    value={form.freeShippingThreshold || ''}
                    onChange={(e) => updateForm('freeShippingThreshold', Number(e.target.value) || undefined)}
                    placeholder="Ex: 5000"
                    className="bg-[#0C0E14] border-[#252836]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Commission Discount */}
          {form.type === 'COMMISSION_DISCOUNT' && (
            <div className="flex items-center gap-2">
              <Switch
                checked={form.deductsFromCommission || false}
                onCheckedChange={(v) => updateForm('deductsFromCommission', v)}
              />
              <label className="text-sm">Deduzir da comissão do vendedor</label>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#252836]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {isNew ? 'Criar Regra' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdvancedRulesSection() {
  const {
    rules,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    duplicateRule,
    resetToDefaults,
  } = useBusinessRules()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  const handleNewRule = () => {
    setEditingRule(null)
    setDialogOpen(true)
  }

  const handleEditRule = (rule: BusinessRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  const handleSave = (rule: BusinessRule) => {
    if (editingRule) {
      updateRule(rule.id, rule)
    } else {
      addRule(rule)
    }
  }

  const handleDelete = (ruleId: string) => {
    removeRule(ruleId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-amber-400" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Motor de Regras Avançado
          </h2>
          <Badge variant="secondary" className="text-xs">
            {rules.filter((r) => r.enabled).length}/{rules.length} ativas
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#252836] text-muted-foreground hover:text-foreground"
            onClick={resetToDefaults}
          >
            Restaurar Padrão
          </Button>
          <Button
            size="sm"
            onClick={handleNewRule}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Plus className="size-4" /> Nova Regra
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule) => {
          const isExpanded = expandedRule === rule.id
          const priorityCfg = PRIORITY_CONFIG[rule.priority]

          return (
            <Card key={rule.id} className="bg-[#151820] border-[#252836]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className="flex-shrink-0"
                    title={rule.enabled ? 'Desativar' : 'Ativar'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="size-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="size-6 text-muted-foreground" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${rule.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {rule.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${RULE_TYPE_COLORS[rule.type]}`}>
                        {RULE_TYPE_LABELS[rule.type]}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${priorityCfg.color}`}>
                        {priorityCfg.icon}
                        {priorityCfg.label}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{rule.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-amber-400"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-blue-400"
                      onClick={() => duplicateRule(rule.id)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#252836] space-y-2 text-xs text-muted-foreground">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <span className="text-muted-foreground/60">Tipo Desconto:</span>{' '}
                        {rule.discountType === 'PERCENTAGE' ? `${rule.discountValue}%` : fmt(rule.discountValue)}
                      </div>
                      {rule.productFilter?.category && (
                        <div>
                          <span className="text-muted-foreground/60">Categoria:</span> {rule.productFilter.category}
                        </div>
                      )}
                      {rule.minOrderValue && (
                        <div>
                          <span className="text-muted-foreground/60">Pedido Mín.:</span> {fmt(rule.minOrderValue)}
                        </div>
                      )}
                      {rule.freeShippingThreshold && (
                        <div>
                          <span className="text-muted-foreground/60">Frete Grátis Acima:</span> {fmt(rule.freeShippingThreshold)}
                        </div>
                      )}
                      {rule.customerFilter?.isVip && (
                        <div>
                          <span className="text-muted-foreground/60">Cliente VIP:</span> Sim
                        </div>
                      )}
                      {rule.progressiveTiers && rule.progressiveTiers.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground/60">Faixas:</span>{' '}
                          {rule.progressiveTiers.map((t, i) => `≥${t.threshold} → ${t.discountValue}%`).join(' | ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <span>Criada: {new Date(rule.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>Atualizada: {new Date(rule.updatedAt).toLocaleDateString('pt-BR')}</span>
                      <span>Aplicada: {rule.appliedCount}x</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Rule Form Dialog */}
      <RuleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={handleSave}
      />
    </div>
  )
}

// ============================================================
// Main Export
// ============================================================

export default function RegrasPage() {
   const [regras, setRegras] = useState<RegrasNegocio>({
     descontoMaximo: 0,
     pedidoMinimo: 0,
     bloqueioInadimplencia: false,
     comissaoPadrao: 0,
     prazoMaximo: 0,
     validarEstoque: false,
     permitirVendaSemEstoque: false,
     nfAutomatica: false,
     aprovarDescontoAcima: 0,
     pedidoMinimoRepresentante: 0,
     creditoAutomatico: false,
     multiploVenda: false
   })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoad = useRef(true)

  // Load from backend on mount
  useEffect(() => {
    async function loadRegras() {
      try {
        const res = await erpApi.getRegras()
        if (res.success && res.data) {
          setRegras(res.data as RegrasNegocio)
        }
      } catch {
        // Keep defaults on error
      } finally {
        isInitialLoad.current = false
      }
    }
    loadRegras()
  }, [])

  // Auto-save on changes with 2s debounce
  useEffect(() => {
    if (isInitialLoad.current) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSaveStatus('saving')
    debounceTimer.current = setTimeout(async () => {
      try {
        await erpApi.updateRegras(regras)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 2000)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [regras])

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div />
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' && 'Salvando...'}
          {saveStatus === 'saved' && '✓ Salvo'}
        </span>
      </div>
      <SimpleRulesSection regras={regras} onUpdate={setRegras} />
      <div className="fv-divider" />
      <AdvancedRulesSection />
    </div>
  )
}
