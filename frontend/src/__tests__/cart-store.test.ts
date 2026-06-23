import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, roundUpToMultiple, roundDownToMultiple, isValidMultiple } from '../store/cart-store'

describe('cart-store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  describe('roundUpToMultiple', () => {
    it('rounds up to nearest multiple', () => {
      expect(roundUpToMultiple(5, 3)).toBe(6)
      expect(roundUpToMultiple(1, 6)).toBe(6)
      expect(roundUpToMultiple(6, 6)).toBe(6)
      expect(roundUpToMultiple(7, 6)).toBe(12)
    })

    it('returns value when multiple is zero or negative', () => {
      expect(roundUpToMultiple(5, 0)).toBe(5)
      expect(roundUpToMultiple(5, -1)).toBe(5)
    })
  })

  describe('roundDownToMultiple', () => {
    it('rounds down to nearest multiple (minimum = multiple)', () => {
      expect(roundDownToMultiple(5, 3)).toBe(3)
      expect(roundDownToMultiple(6, 6)).toBe(6)
      expect(roundDownToMultiple(7, 6)).toBe(6)
      expect(roundDownToMultiple(12, 6)).toBe(12)
    })

    it('returns value when multiple is zero or negative', () => {
      expect(roundDownToMultiple(5, 0)).toBe(5)
      expect(roundDownToMultiple(5, -1)).toBe(5)
    })
  })

  describe('isValidMultiple', () => {
    it('returns true when multiple is 1 or less', () => {
      expect(isValidMultiple(5, 0)).toBe(true)
      expect(isValidMultiple(5, 1)).toBe(true)
    })

    it('checks if value is a valid multiple', () => {
      expect(isValidMultiple(6, 3)).toBe(true)
      expect(isValidMultiple(7, 3)).toBe(false)
      expect(isValidMultiple(0, 3)).toBe(true)
    })
  })

  describe('addItem', () => {
    it('adds new item to cart', () => {
      const { addItem } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(6)
      expect(state.items[0].totalPrice).toBe(60)
    })

    it('rounds quantity to multiple on add', () => {
      const { addItem } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 3,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(6)
    })

    it('increments existing item quantity', () => {
      const { addItem } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(12)
      expect(state.items[0].totalPrice).toBe(120)
    })

    it('calculates totals correctly', () => {
      const { addItem } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 2,
        metroCubico: 0.05,
      })

      const state = useCartStore.getState()
      expect(state.totalItems).toBe(6)
      expect(state.totalValue).toBe(60)
      expect(state.totalWeight).toBe(12)
      expect(state.totalCubagem).toBeCloseTo(0.3)
    })
  })

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { addItem, removeItem } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      removeItem('100')

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.totalItems).toBe(0)
    })
  })

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { addItem, updateQuantity } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      updateQuantity('100', 12)

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(12)
      expect(state.items[0].totalPrice).toBe(120)
    })

    it('removes item when quantity is zero', () => {
      const { addItem, updateQuantity } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      updateQuantity('100', 0)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('clears all items and resets totals', () => {
      const { addItem, clearCart } = useCartStore.getState()
      
      addItem({
        id: '1',
        productId: 100,
        productName: 'Produto Teste',
        productSku: 'SKU001',
        category: 'Categoria',
        factoryId: '1',
        factoryName: 'Fabricante',
        quantity: 6,
        unitPrice: 10,
        qtdCaixa: 6,
        multiploVenda: 6,
        peso: 1,
        metroCubico: 0.01,
      })

      clearCart()

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.totalItems).toBe(0)
      expect(state.totalValue).toBe(0)
      expect(state.totalWeight).toBe(0)
      expect(state.totalCubagem).toBe(0)
    })
  })
})
