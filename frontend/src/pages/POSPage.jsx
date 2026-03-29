// src/pages/POSPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore } from '../store/cart.store'
import { useAuthStore } from '../store/auth.store'
import api from '../utils/api'
import { formatRupiah } from '../utils/format'
import toast from 'react-hot-toast'
import {
  Search, ScanLine, Plus, Minus, Trash2, ShoppingCart,
  CreditCard, Banknote, Smartphone, ChevronDown,
  CheckCircle2, Printer, X, Package, AlertTriangle,
  Tag, ReceiptText, Loader2
} from 'lucide-react'
import ReceiptModal from '../components/ReceiptModal'

const PAYMENT_METHODS = [
  { value: 'CASH',   label: 'Tunai',  icon: Banknote },
  { value: 'QRIS',   label: 'QRIS',   icon: Smartphone },
  { value: 'DEBIT',  label: 'Debit',  icon: CreditCard },
  { value: 'CREDIT', label: 'Kredit', icon: CreditCard },
]

const QUICK_AMOUNTS = [50000, 100000, 50000*4, 500000, 1000000]

export default function POSPage() {
  const { user } = useAuthStore()
  const cart = useCartStore()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const searchRef = useRef(null)
  const barcodeRef = useRef(null)
  const amountRef = useRef(null)
  const barcodeTimer = useRef(null)

  // Fetch categories
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {})
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const params = { limit: 60 }
      if (search) params.search = search
      if (selectedCategory !== 'all') params.categoryId = selectedCategory
      const { data } = await api.get('/products', { params })
      setProducts(data.data)
    } catch {}
    setLoadingProducts(false)
  }, [search, selectedCategory])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [fetchProducts])

  // Barcode scanner (rapid keypress detection)
  useEffect(() => {
    let buffer = ''
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'Enter' && buffer.length > 4) {
        handleBarcodeSearch(buffer)
        buffer = ''
        return
      }
      if (e.key.length === 1) {
        buffer += e.key
        clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { buffer = '' }, 100)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleBarcodeSearch = async (code) => {
    try {
      const { data } = await api.get(`/products/barcode/${code}`)
      const err = cart.addItem(data.data)
      if (err) toast.error(err.error)
      else toast.success(`${data.data.name} ditambahkan`, { duration: 1500 })
    } catch {
      toast.error(`Barcode ${code} tidak ditemukan`)
    }
  }

  const handleManualBarcode = async (e) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    await handleBarcodeSearch(barcodeInput.trim())
    setBarcodeInput('')
  }

  const handleAddProduct = (product) => {
    const err = cart.addItem(product)
    if (err) toast.error(err.error)
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) { toast.error('Keranjang kosong'); return }
    const paid = parseFloat(cart.amountPaid)
    if (cart.paymentMethod === 'CASH' && (!paid || paid < cart.getTotal())) {
      toast.error('Jumlah bayar kurang dari total')
      amountRef.current?.focus()
      return
    }
    setProcessing(true)
    try {
      const payload = {
        items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity, discountPct: i.discountPct })),
        paymentMethod: cart.paymentMethod,
        amountPaid: cart.paymentMethod === 'CASH' ? paid : cart.getTotal(),
        discountAmount: cart.discount,
      }
      const { data } = await api.post('/transactions', payload)
      setReceipt(data.data)
      cart.clear()
      setShowCheckout(false)
      toast.success('Transaksi berhasil! 🎉')
      fetchProducts()
    } catch {}
    setProcessing(false)
  }

  const subtotal = cart.getSubtotal()
  const total = cart.getTotal()
  const change = cart.getChange()
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* ── LEFT: Product Grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="px-5 py-4 border-b border-surface-border bg-surface-card flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <ShoppingCart className="w-4.5 h-4.5" />
            <span className="font-display font-semibold text-white">POS</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm">{user?.name}</span>
          </div>
          <div className="flex-1" />

          {/* Barcode manual input */}
          <form onSubmit={handleManualBarcode} className="flex items-center gap-2">
            <div className="relative">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan / ketik barcode…"
                className="input pl-9 py-2 text-sm w-56"
              />
            </div>
            <button type="submit" className="btn-secondary py-2 text-sm px-3">
              Cari
            </button>
          </form>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk, lokasi…"
              className="input pl-9 py-2 text-sm w-52"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-5 py-3 border-b border-surface-border flex gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
            }`}
          >
            Semua
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="font-body">Memuat produk…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <Package className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-display font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAddProduct} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── */}
      <div className="w-96 flex flex-col border-l border-surface-border bg-surface-card shrink-0">

        {/* Cart header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-brand-400" />
            <span className="font-display font-bold text-white">Keranjang</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-xs font-mono font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          {cart.items.length > 0 && (
            <button onClick={cart.clear} className="text-xs text-slate-500 hover:text-red-400 transition-colors font-display flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-16">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-display font-medium text-slate-500">Keranjang kosong</p>
              <p className="text-xs text-slate-600 mt-1">Pilih produk untuk mulai transaksi</p>
            </div>
          ) : (
            cart.items.map(item => (
              <CartItem
                key={item.productId}
                item={item}
                onRemove={() => cart.removeItem(item.productId)}
                onQty={(q) => cart.updateQuantity(item.productId, q)}
                onDiscount={(d) => cart.updateItemDiscount(item.productId, d)}
              />
            ))
          )}
        </div>

        {/* Summary & checkout */}
        <div className="border-t border-surface-border px-5 py-4 space-y-3 shrink-0">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-display font-medium text-slate-400 flex-1">Diskon Total</span>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Rp</span>
              <input
                type="number"
                min="0"
                value={cart.discount || ''}
                onChange={e => cart.setDiscount(e.target.value)}
                placeholder="0"
                className="input pl-8 py-1.5 text-sm text-right"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 py-2 border-t border-surface-border">
            <div className="flex justify-between text-sm text-slate-400 font-body">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-green-400 font-body">
                <span>Diskon</span>
                <span>- {formatRupiah(cart.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-white text-lg pt-1">
              <span>Total</span>
              <span className="text-brand-300">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-display font-medium text-slate-400 mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => cart.setPaymentMethod(value)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-display font-semibold transition-all ${
                    cart.paymentMethod === value
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                      : 'border-surface-border text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid (cash only) */}
          {cart.paymentMethod === 'CASH' && (
            <div>
              <p className="text-xs font-display font-medium text-slate-400 mb-2">Jumlah Dibayar</p>
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono">Rp</span>
                <input
                  ref={amountRef}
                  type="number"
                  min="0"
                  value={cart.amountPaid}
                  onChange={e => cart.setAmountPaid(e.target.value)}
                  placeholder={total.toString()}
                  className="input pl-10 font-mono text-right"
                />
              </div>
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.filter(a => a >= total * 0.5).slice(0, 4).map(a => (
                  <button
                    key={a}
                    onClick={() => cart.setAmountPaid(String(a))}
                    className="px-2.5 py-1 rounded-lg bg-surface-DEFAULT border border-surface-border text-xs font-mono text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
                  >
                    {formatRupiah(a)}
                  </button>
                ))}
                <button
                  onClick={() => cart.setAmountPaid(String(Math.ceil(total / 1000) * 1000))}
                  className="px-2.5 py-1 rounded-lg bg-brand-900/30 border border-brand-800/40 text-xs font-mono text-brand-400 hover:bg-brand-900/50 transition-all"
                >
                  Pas
                </button>
              </div>
              {parseFloat(cart.amountPaid) >= total && (
                <div className="mt-2 flex justify-between text-sm font-display font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                  <span>Kembalian</span>
                  <span>{formatRupiah(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={cart.items.length === 0 || processing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses…
              </>
            ) : (
              <>
                <ReceiptText className="w-4.5 h-4.5" />
                Bayar {total > 0 ? formatRupiah(total) : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal transaction={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  )
}

// ── Product Card ──
function ProductCard({ product, onAdd }) {
  const isLowStock = product.stock <= product.minStock
  const isOutOfStock = product.stock === 0

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={`card p-3.5 text-left transition-all duration-150 group relative overflow-hidden
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-brand-500/40 hover:bg-surface-hover active:scale-[0.97] cursor-pointer'
        }`}
    >
      {/* Category badge */}
      <span className="text-xs font-mono text-slate-600 block mb-1.5 truncate">
        {product.category?.name}
      </span>

      {/* Name */}
      <p className="font-display font-semibold text-sm text-white leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </p>

      {/* Price */}
      <p className="font-display font-bold text-brand-400 text-base mb-3">
        {formatRupiah(product.price)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
          isOutOfStock
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : isLowStock
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
        </span>
        {product.rackLocation && (
          <span className="text-xs font-mono text-slate-600">{product.rackLocation}</span>
        )}
      </div>

      {/* Add button overlay */}
      {!isOutOfStock && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1 group-hover:translate-y-0">
          <Plus className="w-4 h-4 text-white" />
        </div>
      )}

      {isLowStock && !isOutOfStock && (
        <AlertTriangle className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-500 opacity-70" />
      )}
    </button>
  )
}

// ── Cart Item ──
function CartItem({ item, onRemove, onQty, onDiscount }) {
  const [showDiscount, setShowDiscount] = useState(false)
  const lineTotal = item.price * item.quantity * (1 - item.discountPct / 100)

  return (
    <div className="bg-surface-DEFAULT rounded-xl p-3 border border-surface-border animate-slide-up">
      <div className="flex items-start gap-2 mb-2">
        <p className="flex-1 text-sm font-display font-medium text-white leading-snug">{item.name}</p>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Qty controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onQty(item.quantity - 1)}
            className="w-6 h-6 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-7 text-center text-sm font-mono font-semibold text-white">{item.quantity}</span>
          <button
            onClick={() => onQty(item.quantity + 1)}
            className="w-6 h-6 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className={`ml-1 text-xs px-1.5 py-0.5 rounded font-mono transition-all ${
              item.discountPct > 0
                ? 'text-green-400 bg-green-500/10'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {item.discountPct > 0 ? `-${item.discountPct}%` : '%'}
          </button>
        </div>

        <p className="text-sm font-display font-bold text-brand-300">{formatRupiah(lineTotal)}</p>
      </div>

      {showDiscount && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-500">Diskon:</span>
          <input
            type="number"
            min="0"
            max="100"
            value={item.discountPct}
            onChange={e => onDiscount(e.target.value)}
            className="input py-1 text-xs w-20 text-center"
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      )}
    </div>
  )
}
