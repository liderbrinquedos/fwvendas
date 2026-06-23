import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string              // unique cart item id
  productId: number       // product id from DB
  productName: string
  productSku: string
  category: string
  factoryId: string       // grupo/categoria do produto
  factoryName: string
  quantity: number
  unitPrice: number
  totalPrice: number      // quantity * unitPrice
  qtdCaixa: number        // quantidade na caixa (embalagem)
  multiploVenda: number   // regra de incremento no carrinho
  peso: number            // peso unitário em kg
  metroCubico: number     // volume unitário em m³
}

/** Round up to nearest multiple */
export function roundUpToMultiple(value: number, multiple: number): number {
  if (multiple <= 0) return value
  return Math.ceil(value / multiple) * multiple
}

/** Round down to nearest multiple (minimum = multiple) */
export function roundDownToMultiple(value: number, multiple: number): number {
  if (multiple <= 0) return value
  const rounded = Math.floor(value / multiple) * multiple
  return rounded < multiple ? multiple : rounded
}

/** Check if value is a valid multiple */
export function isValidMultiple(value: number, multiple: number): boolean {
  if (multiple <= 1) return true // no restriction
  return value % multiple === 0
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalValue: number
  totalWeight: number
  totalCubagem: number
  addItem: (item: Omit<CartItem, 'totalPrice'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  incrementByMultiplo: (productId: string) => void
  decrementByMultiplo: (productId: string) => void
  setQuantityWithValidation: (productId: string, quantity: number) => { valid: boolean; roundedValue: number }
  clearCart: () => void
}

function recalculateTotals(items: CartItem[]): { totalItems: number; totalValue: number; totalWeight: number; totalCubagem: number } {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: items.reduce((sum, item) => sum + item.totalPrice, 0),
    totalWeight: items.reduce((sum, item) => sum + item.quantity * item.peso, 0),
    totalCubagem: items.reduce((sum, item) => sum + item.quantity * item.metroCubico, 0),
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalValue: 0,
      totalWeight: 0,
      totalCubagem: 0,

      addItem: (item) => {
        const state = get()
        const { items } = state

        const multiplo = item.multiploVenda > 0 ? item.multiploVenda : item.qtdCaixa || 1
        const adjustedQty = item.quantity < multiplo ? multiplo : roundUpToMultiple(item.quantity, multiplo)

        const existingIndex = items.findIndex((i) => i.productId === item.productId)

        let newItems: CartItem[]
        if (existingIndex >= 0) {
          newItems = items.map((existing, index) => {
            if (index === existingIndex) {
              const updatedQuantity = existing.quantity + adjustedQty
              return {
                ...existing,
                quantity: updatedQuantity,
                totalPrice: updatedQuantity * existing.unitPrice,
              }
            }
            return existing
          })
        } else {
          const newItem: CartItem = {
            ...item,
            quantity: adjustedQty,
            totalPrice: adjustedQty * item.unitPrice,
          }
          newItems = [...items, newItem]
        }

        const totals = recalculateTotals(newItems)
        set({
          items: newItems,
          ...totals,
        })
      },

      removeItem: (productId: string) => {
        const state = get()
        const newItems = state.items.filter((i) => String(i.productId) !== productId)
        const totals = recalculateTotals(newItems)
        set({
          items: newItems,
          ...totals,
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        const state = get()

        if (quantity <= 0) {
          // Remove item if quantity is zero or negative
          get().removeItem(productId)
          return
        }

        const newItems = state.items.map((item) => {
          if (String(item.productId) === productId) {
            return {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice,
            }
          }
          return item
        })

        const totals = recalculateTotals(newItems)
        set({
          items: newItems,
          ...totals,
        })
      },

      incrementByMultiplo: (productId: string) => {
        const state = get()
        const item = state.items.find((i) => String(i.productId) === productId)
        if (!item) return
        const multiplo = item.multiploVenda > 0 ? item.multiploVenda : item.qtdCaixa || 1
        const newQty = item.quantity + multiplo
        get().updateQuantity(productId, newQty)
      },

      decrementByMultiplo: (productId: string) => {
        const state = get()
        const item = state.items.find((i) => String(i.productId) === productId)
        if (!item) return
        const multiplo = item.multiploVenda > 0 ? item.multiploVenda : item.qtdCaixa || 1
        const newQty = item.quantity - multiplo
        if (newQty <= 0) {
          get().removeItem(productId)
        } else {
          get().updateQuantity(productId, newQty)
        }
      },

      setQuantityWithValidation: (productId: string, quantity: number) => {
        const state = get()
        const item = state.items.find((i) => String(i.productId) === productId)
        if (!item) return { valid: false, roundedValue: quantity }

        const multiplo = item.multiploVenda > 0 ? item.multiploVenda : item.qtdCaixa || 1

        if (quantity <= 0) {
          return { valid: true, roundedValue: 0 } // will trigger removal
        }

        if (!isValidMultiple(quantity, multiplo)) {
          // Round up to nearest multiple
          const roundedValue = roundUpToMultiple(quantity, multiplo)
          return { valid: false, roundedValue }
        }

        // Valid multiple - apply it
        get().updateQuantity(productId, quantity)
        return { valid: true, roundedValue: quantity }
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalValue: 0,
          totalWeight: 0,
          totalCubagem: 0,
        })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
)
