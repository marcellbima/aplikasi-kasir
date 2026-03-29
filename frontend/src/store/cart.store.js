// src/store/cart.store.js
import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'CASH',
  amountPaid: '',

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) return { error: `Stok hanya ${product.stock}` }
      set({ items: items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) })
    } else {
      if (product.stock === 0) return { error: 'Stok habis' }
      set({
        items: [...items, {
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          stock: product.stock,
          quantity: 1,
          discountPct: 0,
        }]
      })
    }
    return null
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

  updateQuantity: (productId, qty) => {
    const items = get().items
    const item = items.find((i) => i.productId === productId)
    if (!item) return
    if (qty <= 0) { set({ items: items.filter((i) => i.productId !== productId) }); return }
    if (qty > item.stock) return
    set({ items: items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) })
  },

  updateItemDiscount: (productId, discountPct) =>
    set({ items: get().items.map((i) => i.productId === productId ? { ...i, discountPct: parseFloat(discountPct) || 0 } : i) }),

  setDiscount: (v) => set({ discount: parseFloat(v) || 0 }),
  setPaymentMethod: (v) => set({ paymentMethod: v }),
  setAmountPaid: (v) => set({ amountPaid: v }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity * (1 - i.discountPct / 100), 0),
  getTotal: () => Math.max(0, get().getSubtotal() - (get().discount || 0)),
  getChange: () => {
    const paid = parseFloat(get().amountPaid) || 0
    return Math.max(0, paid - get().getTotal())
  },

  clear: () => set({ items: [], discount: 0, paymentMethod: 'CASH', amountPaid: '' }),
}))
