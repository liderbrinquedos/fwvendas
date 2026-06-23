import { BusinessRule, RulesEngineContext, RulesEngineResult, RuleApplicationResult, ItemDiscountAllocation, CartItemContext } from './types'

const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export class BusinessRulesEngine {
  private rules: BusinessRule[]

  constructor(rules: BusinessRule[]) {
    this.rules = rules
  }

  setRules(rules: BusinessRule[]) {
    this.rules = rules
  }

  addRule(rule: BusinessRule) {
    this.rules.push(rule)
  }

  removeRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId)
  }

  toggleRule(ruleId: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) rule.enabled = enabled
  }

  process(context: RulesEngineContext): RulesEngineResult {
    const enabledRules = this.rules.filter(r => r.enabled)
    const sortedRules = [...enabledRules].sort((a, b) => 
      (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
    )

    let totalDiscount = 0
    let commissionDiscount = 0
    let freeShipping = false
    const appliedRules: RuleApplicationResult[] = []
    const maxDiscountRules: BusinessRule[] = []

    for (const rule of sortedRules) {
      if (rule.type === 'MAX_DISCOUNT') {
        maxDiscountRules.push(rule)
        continue
      }
      const result = this.evaluateRule(rule, context)
      if (result) {
        appliedRules.push(result)
        totalDiscount += result.discountTotal
        if (result.freeShipping) freeShipping = true
        if (rule.type === 'COMMISSION_DISCOUNT' && rule.deductsFromCommission) {
          // Fix 7 (P1): Desconto "dividido" — o cliente recebe o desconto (discountTotal)
          // e o vendedor perde a mesma quantidade de comissao (commissionDiscount).
          // Este e o comportamento intencional conforme acordo comercial do projeto.
          commissionDiscount += result.discountTotal
        }
      }
    }

    // Apply MAX_DISCOUNT rules after all others
    for (const rule of maxDiscountRules) {
      const maxPercent = rule.discountValue
      const maxAllowed = context.orderSubtotal * (maxPercent / 100)
      if (totalDiscount > maxAllowed) {
        const excess = totalDiscount - maxAllowed
        const ratio = maxAllowed / totalDiscount
        totalDiscount = maxAllowed
        // Fix 8 (P1): Ajustar commissionDiscount proporcionalmente ao corte
        if (commissionDiscount > 0) {
          commissionDiscount = commissionDiscount * ratio
        }
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: 'MAX_DISCOUNT',
          discountTotal: -excess,
          freeShipping: false,
          message: `Desconto m�ximo limitado a ${maxPercent}% (-${excess.toFixed(2)})`,
          itemAllocations: []
        })
      }
    }

    return {
      subtotal: context.orderSubtotal,
      discount: totalDiscount,
      commissionDiscount,
      freeShipping,
      appliedRules,
      finalTotal: Math.max(0, context.orderSubtotal - totalDiscount - (freeShipping ? context.freightCost : 0))
    }
  }

  private evaluateRule(rule: BusinessRule, context: RulesEngineContext): RuleApplicationResult | null {
    if (rule.type === 'CASH_DISCOUNT') {
      const isAVista = context.paymentCondition === 'A vista'
      if (!isAVista) return null
    }
    if (rule.type === 'COMBO_PRODUCTS') {
      if (rule.requiredProductIds && rule.requiredProductIds.length > 0) {
        const cartIds = new Set(context.cartItems.map(item => item.productId))
        const hasAll = rule.requiredProductIds.every(id => cartIds.has(id))
        if (!hasAll) return null
      }
    }
    // Check customer filter
    if (!this.checkCustomerFilter(rule, context)) return null
    // Check date range
    if (!this.checkDateRange(rule)) return null
    // Filter applicable items
    const applicableItems = this.filterApplicableItems(rule, context)
    if (applicableItems.length === 0 && rule.type !== 'FREE_SHIPPING') return null
    // Check threshold conditions
    if (!this.checkThreshold(rule, context, applicableItems)) return null
    // Calculate discount
    return this.calculateDiscountWithAllocation(rule, context, applicableItems)
  }

  private checkCustomerFilter(rule: BusinessRule, context: RulesEngineContext): boolean {
    if (!rule.customerFilter) return true
    const cf = rule.customerFilter
    if (cf.customerIds && cf.customerIds.length > 0 && !cf.customerIds.includes(context.customerId)) return false
    if (cf.isVip !== undefined && cf.isVip !== context.customerData.isVip) return false
    if (cf.city && cf.city !== context.customerData.city) return false
    return true
  }

  private checkDateRange(rule: BusinessRule): boolean {
    if (!rule.dateRange) return true
    const now = new Date()
    const start = new Date(rule.dateRange.start)
    const end = new Date(rule.dateRange.end)
    return now >= start && now <= end
  }

  private filterApplicableItems(rule: BusinessRule, context: RulesEngineContext): CartItemContext[] {
    if (!rule.productFilter) return context.cartItems
    const pf = rule.productFilter
    return context.cartItems.filter(item => {
      if (pf.productIds && pf.productIds.length > 0 && !pf.productIds.includes(item.productId)) return false
      if (pf.category && pf.category !== item.category) return false
      if (pf.factoryId && pf.factoryId !== item.factoryId) return false
      if (pf.skuPatterns && pf.skuPatterns.length > 0) {
        const valueToMatch = item.productSku ?? item.productName
        const matches = pf.skuPatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/[.^$?*+()[\]{}]/g, '\\$&').replace(/\*/g, '.*'))
          return regex.test(valueToMatch)
        })
        if (!matches) return false
      }
      return true
    })
  }

  private checkThreshold(rule: BusinessRule, context: RulesEngineContext, applicableItems: CartItemContext[]): boolean {
    // Check minOrderValue
    if (rule.minOrderValue && context.orderSubtotal < rule.minOrderValue) return false
    // Check minOrderQuantity
    if (rule.minOrderQuantity) {
      const totalQty = applicableItems.reduce((s, i) => s + i.quantity, 0)
      if (totalQty < rule.minOrderQuantity) return false
    }
    // Check threshold condition
    if (rule.threshold) {
      const t = rule.threshold
      let value: number
      if (t.type === 'quantity') {
        value = applicableItems.reduce((s, i) => s + i.quantity, 0)
      } else {
        value = applicableItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      }
      switch (t.operator) {
        case 'GREATER_THAN': if (!(value > t.value)) return false; break
        case 'LESS_THAN': if (!(value < t.value)) return false; break
        case 'EQUALS': if (!(value === t.value)) return false; break
        case 'GREATER_THAN_OR_EQUAL': if (!(value >= t.value)) return false; break
        case 'LESS_THAN_OR_EQUAL': if (!(value <= t.value)) return false; break
      }
    }
    return true
  }

  private calculateDiscountWithAllocation(rule: BusinessRule, context: RulesEngineContext, applicableItems: CartItemContext[]): RuleApplicationResult | null {
    let discountTotal = 0
    let allocations: ItemDiscountAllocation[] = []
    let freeShippingResult = false

    if (rule.type === 'FREE_SHIPPING') {
      if (rule.freeShippingThreshold && context.orderSubtotal < rule.freeShippingThreshold) {
        return null
      }
      // Sem threshold OU threshold atingido: frete gratis
      freeShippingResult = true
      return {
        ruleId: rule.id, ruleName: rule.name, ruleType: rule.type,
        discountTotal: 0, freeShipping: true,
        message: `Frete gratis${rule.freeShippingThreshold ? ` (pedidos acima de R$ ${rule.freeShippingThreshold})` : ''}`,
        itemAllocations: []
      }
    }

    if (rule.type === 'PROGRESSIVE' && rule.progressiveTiers) {
      const totalQty = applicableItems.reduce((s, i) => s + i.quantity, 0)
      const sortedTiers = [...rule.progressiveTiers].sort((a, b) => b.threshold - a.threshold)
      const applicableTier = sortedTiers.find(t => totalQty >= t.threshold)
      if (!applicableTier) {
        return null
      }
      const totalValue = applicableItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      discountTotal = rule.discountType === 'PERCENTAGE' 
        ? totalValue * (applicableTier.discountValue / 100) 
        : applicableTier.discountValue
      allocations = this.allocateDiscount(applicableItems, discountTotal)
    } else {
      const totalValue = applicableItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      const totalQuantity = applicableItems.reduce((s, i) => s + i.quantity, 0)
      discountTotal = rule.discountType === 'PERCENTAGE' 
        ? totalValue * (rule.discountValue / 100) 
        : rule.discountValue * totalQuantity
      allocations = this.allocateDiscount(applicableItems, discountTotal)
    }

    return {
      ruleId: rule.id, ruleName: rule.name, ruleType: rule.type,
      discountTotal, freeShipping: freeShippingResult,
      message: this.getRuleMessage(rule, discountTotal),
      itemAllocations: allocations
    }
  }

  private allocateDiscount(items: CartItemContext[], totalDiscount: number): ItemDiscountAllocation[] {
    const totalValue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    if (totalValue === 0) return []
    
    let allocated = 0
    return items.map((item, i) => {
      const proportion = (item.quantity * item.unitPrice) / totalValue
      let amount: number
      if (i === items.length - 1) {
        amount = totalDiscount - allocated
      } else {
        amount = totalDiscount * proportion
        allocated += amount
      }
      return {
        productId: item.productId,
        discountAmount: amount,
        originalPrice: item.quantity * item.unitPrice,
        discountedPrice: item.quantity * item.unitPrice - amount
      }
    })
  }

  private getRuleMessage(rule: BusinessRule, discountTotal: number): string {
    const formatted = discountTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    switch (rule.type) {
      case 'PROMOTIONAL': return `Promoção: -${formatted}`
      case 'QUANTITY_THRESHOLD': return `Desconto por quantidade: -${formatted}`
      case 'VALUE_THRESHOLD': return `Desconto por valor: -${formatted}`
      case 'CASH_DISCOUNT': return `Desconto à vista: -${formatted}`
      case 'CATEGORY_PROMO': return `Promoção de categoria: -${formatted}`
      case 'CUSTOMER_VIP': return `Desconto VIP: -${formatted}`
      case 'COMMISSION_DISCOUNT': return `Desconto sobre comissão: -${formatted}`
      case 'COMBO_PRODUCTS': return `Desconto combo: -${formatted}`
      case 'PROGRESSIVE': return `Desconto progressivo: -${formatted}`
      default: return `${rule.name}: -${formatted}`
    }
  }
}

export function createRulesEngine(rules: BusinessRule[]): BusinessRulesEngine {
  return new BusinessRulesEngine(rules)
}
