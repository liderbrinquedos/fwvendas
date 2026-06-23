export type RuleType = 
  | 'PROMOTIONAL' 
  | 'QUANTITY_THRESHOLD' 
  | 'VALUE_THRESHOLD' 
  | 'FREE_SHIPPING' 
  | 'MAX_DISCOUNT' 
  | 'CASH_DISCOUNT' 
  | 'PROGRESSIVE' 
  | 'CUSTOMER_VIP' 
  | 'CATEGORY_PROMO' 
  | 'COMMISSION_DISCOUNT' 
  | 'COMBO_PRODUCTS'

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export type RulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ThresholdOperator = 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN_OR_EQUAL'

export interface ThresholdCondition {
  type: 'quantity' | 'value'
  operator: ThresholdOperator
  value: number
}

export interface ProductFilter {
  productIds?: number[]
  category?: string
  factoryId?: string
  skuPatterns?: string[]
}

export interface CustomerFilter {
  customerIds?: number[]
  isVip?: boolean
  city?: string
}

export interface DateRange {
  start: string  // ISO date string
  end: string
}

export interface ProgressiveTier {
  threshold: number
  discountValue: number
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  type: RuleType
  enabled: boolean
  priority: RulePriority
  // Conditions
  productFilter?: ProductFilter
  customerFilter?: CustomerFilter
  dateRange?: DateRange
  threshold?: ThresholdCondition
  minOrderValue?: number
  minOrderQuantity?: number
  // Discount config
  discountType: DiscountType
  discountValue: number
  // Specific configs
  deductsFromCommission?: boolean  // for COMMISSION_DISCOUNT
  progressiveTiers?: ProgressiveTier[]  // for PROGRESSIVE
  requiredProductIds?: number[]  // for COMBO_PRODUCTS
  freeShippingThreshold?: number  // for FREE_SHIPPING
  // Metadata
  createdAt: string
  updatedAt: string
  appliedCount: number
}

export interface CartItemContext {
  productId: number
  productName: string
  productSku?: string
  category: string
  factoryId: string
  quantity: number
  unitPrice: number
}

export interface CustomerDataContext {
  isVip: boolean
  city: string
}

export interface RulesEngineContext {
  cartItems: CartItemContext[]
  customerId: number
  customerData: CustomerDataContext
  orderSubtotal: number
  paymentCondition: string
  freightType: string
  freightCost: number
}

export interface ItemDiscountAllocation {
  productId: number
  discountAmount: number
  originalPrice: number
  discountedPrice: number
}

export interface RuleApplicationResult {
  ruleId: string
  ruleName: string
  ruleType: RuleType
  discountTotal: number
  freeShipping: boolean
  message: string
  itemAllocations: ItemDiscountAllocation[]
}

export interface RulesEngineResult {
  subtotal: number
  discount: number
  commissionDiscount: number
  freeShipping: boolean
  appliedRules: RuleApplicationResult[]
  finalTotal: number
}
