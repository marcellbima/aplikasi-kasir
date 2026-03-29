// src/pages/ProductsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { formatRupiah } from '../utils/format'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Package, Loader2, X, AlertTriangle } from 'lucide-react'

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', categoryId: '',
  price: '', costPrice: '', stock: '', minStock: '5',
  rackLocation: '', description: ''
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | product object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [pagination, setPagination] = useState({})
  const [newCategoryName, setNewCategoryName] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/products', { params: { limit: 50, search } })
      setProducts(data.data)
      setPagination(data.pagination)
    } catch { }
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [fetchProducts])

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => { })
  }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setNewCategoryName(''); setModal('create') }
  const openEdit = (p) => {
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '',
      categoryId: p.categoryId, price: p.price, costPrice: p.costPrice,
      stock: p.stock, minStock: p.minStock,
      rackLocation: p.rackLocation || '', description: p.description || ''
    })
    setNewCategoryName('')
    setModal(p)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let finalCategoryId = form.categoryId

      if (finalCategoryId === 'NEW_CATEGORY') {
        if (!newCategoryName.trim()) {
          toast.error('Nama kategori baru tidak boleh kosong!')
          setSaving(false)
          return
        }

        const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        const res = await api.post('/categories', { name: newCategoryName, slug })
        finalCategoryId = res.data.data.id
        setCategories(prev => [...prev, res.data.data])
      }

      const payload = { ...form, categoryId: finalCategoryId }

      if (modal === 'create') {
        await api.post('/products', payload)
        toast.success('Produk ditambahkan!')
      } else {
        await api.put(`/products/${modal.id}`, payload)
        toast.success('Produk diperbarui!')
      }
      setModal(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan produk')
    }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus produk "${name}"?`)) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Produk dihapus.')
      fetchProducts()
    } catch { }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Produk</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} produk terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, SKU, barcode, lokasi…"
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Produk', 'Kategori', 'Harga Jual', 'Harga Beli', 'Stok', 'Lokasi', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-display font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat…
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-600">
                  <Package className="w-8 h-8 inline mb-2 opacity-30" /><br />Tidak ada produk
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-display font-medium text-white">{p.name}</p>
                    <p className="text-xs font-mono text-slate-500">{p.sku}</p>
                    {p.barcode && <p className="text-xs font-mono text-slate-600">{p.barcode}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.category?.name}</td>
                  <td className="px-4 py-3 font-display font-semibold text-brand-300">{formatRupiah(p.price)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatRupiah(p.costPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm font-semibold ${p.stock === 0 ? 'text-red-400' :
                        p.stock <= p.minStock ? 'text-amber-400' : 'text-green-400'
                      }`}>
                      {p.stock}
                    </span>
                    {p.stock <= p.minStock && p.stock > 0 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline ml-1.5" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{p.rackLocation || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-500 hover:text-brand-400 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-surface-card">
              <h2 className="font-display font-bold text-white">
                {modal === 'create' ? 'Tambah Produk' : `Edit: ${modal.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nama Produk *</label>
                  <input className="input" required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Samsung Galaxy A55" />
                </div>
                <div>
                  <label className="label">SKU *</label>
                  <input className="input font-mono" required value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="SAM-A55-5G" />
                </div>
                <div>
                  <label className="label">Barcode</label>
                  <input className="input font-mono" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="8806095071234" />
                </div>
                <div>
                  <label className="label">Kategori *</label>
                  <select className="input" required value={form.categoryId} onChange={e => {
                    f('categoryId', e.target.value)
                    if (e.target.value !== 'NEW_CATEGORY') setNewCategoryName('')
                  }}>
                    <option value="">— pilih —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="NEW_CATEGORY" className="font-bold text-brand-400">+ Tambah Kategori Baru</option>
                  </select>
                </div>
                {form.categoryId === 'NEW_CATEGORY' && (
                  <div className="border-l-2 border-brand-500 pl-3 ml-1 animate-fade-in">
                    <label className="label text-brand-400">Nama Kategori Baru *</label>
                    <input className="input border-brand-500/50 focus:border-brand-500" required autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Misal: Smartwatch" />
                  </div>
                )}
                <div>
                  <label className="label">Lokasi Rak</label>
                  <input className="input font-mono" value={form.rackLocation} onChange={e => f('rackLocation', e.target.value)} placeholder="A1" />
                </div>
                <div>
                  <label className="label">Harga Jual *</label>
                  <input className="input" type="number" min="0" required value={form.price} onChange={e => f('price', e.target.value)} placeholder="5499000" />
                </div>
                <div>
                  <label className="label">Harga Beli *</label>
                  <input className="input" type="number" min="0" required value={form.costPrice} onChange={e => f('costPrice', e.target.value)} placeholder="4800000" />
                </div>
                {modal === 'create' && (
                  <div>
                    <label className="label">Stok Awal</label>
                    <input className="input" type="number" min="0" value={form.stock} onChange={e => f('stock', e.target.value)} placeholder="0" />
                  </div>
                )}
                <div>
                  <label className="label">Minimum Stok</label>
                  <input className="input" type="number" min="0" value={form.minStock} onChange={e => f('minStock', e.target.value)} placeholder="5" />
                </div>
                <div className="col-span-2">
                  <label className="label">Deskripsi</label>
                  <textarea className="input resize-none" rows={2} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Deskripsi produk…" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal === 'create' ? 'Simpan' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
