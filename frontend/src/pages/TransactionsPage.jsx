// src/pages/TransactionsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { formatRupiah, formatDate } from '../utils/format'
import { Receipt, Loader2, Eye, X, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_LABELS = { CASH: 'Tunai', QRIS: 'QRIS', DEBIT: 'Debit', CREDIT: 'Kredit' }
const STATUS_LABELS = { COMPLETED: 'Selesai', PENDING: 'Tertunda', CANCELLED: 'Dibatalkan', REFUNDED: 'Dikembalikan' }

export default function TransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({})
  const [page, setPage] = useState(1)

  // Modals state
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/transactions', { params: { page, limit: 20 } })
      setTransactions(data.data)
      setPagination(data.pagination)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const viewDetail = async (id) => {
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/transactions/${id}`)
      setDetail(data.data)
    } catch { }
    setDetailLoading(false)
  }

  const openEdit = (tx) => {
    setEditTx({ ...tx })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      await api.put(`/transactions/${editTx.id}`, {
        status: editTx.status,
        paymentMethod: editTx.paymentMethod,
        notes: editTx.notes
      })
      toast.success('Transaksi berhasil diperbarui')
      setEditTx(null)
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui transaksi')
    }
    setSubmitLoading(false)
  }

  const handleDelete = async () => {
    setSubmitLoading(true)
    try {
      await api.delete(`/transactions/${deleteId}`)
      toast.success('Transaksi berhasil dihapus dan stok dikembalikan')
      setDeleteId(null)
      if (transactions.length === 1 && page > 1) setPage(p => p - 1)
      else fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus transaksi')
    }
    setSubmitLoading(false)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} total transaksi</p>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Transaksi
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['No. Invoice', 'Kasir', 'Total', 'Status', 'Pembayaran', 'Waktu', 'Aksi'].map(h => (
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
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-600">
                  <Receipt className="w-8 h-8 inline mb-2 opacity-30" /><br />Belum ada transaksi
                </td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-brand-300 text-xs whitespace-nowrap">{tx.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{tx.user?.name}</td>
                  <td className="px-4 py-3 font-display font-semibold text-white whitespace-nowrap">{formatRupiah(tx.total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge ${tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        tx.status === 'REFUNDED' || tx.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                      {STATUS_LABELS[tx.status] || tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {PAYMENT_LABELS[tx.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => viewDetail(tx.id)}
                        title="Lihat Detail"
                        className="p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-500 hover:text-brand-400 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(tx)}
                        title="Edit Transaksi"
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        title="Hapus Transaksi"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                      >
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-mono transition-all ${p === page
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-card text-slate-400 hover:text-white border border-surface-border'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-surface-card z-10">
              <h2 className="font-display font-bold text-white">Detail Transaksi</h2>
              <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400 inline" />
              </div>
            ) : detail && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-slate-500">Invoice</p><p className="font-mono text-white">{detail.invoiceNumber}</p></div>
                  <div><p className="text-slate-500">Kasir</p><p className="text-white">{detail.user?.name}</p></div>
                  <div><p className="text-slate-500">Waktu</p><p className="text-white text-xs">{formatDate(detail.createdAt)}</p></div>
                  <div><p className="text-slate-500">Pembayaran</p><p className="text-white">{PAYMENT_LABELS[detail.paymentMethod]}</p></div>
                </div>

                <div className="border-t border-surface-border pt-4">
                  <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">Item</p>
                  <div className="space-y-2">
                    {detail.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-white">{item.productName}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × {formatRupiah(item.unitPrice)}
                            {item.discountPct > 0 && ` (-${item.discountPct}%)`}
                          </p>
                        </div>
                        <p className="font-display font-semibold text-brand-300">{formatRupiah(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-surface-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>{formatRupiah(detail.subtotal)}</span></div>
                  {parseFloat(detail.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-400"><span>Diskon</span><span>- {formatRupiah(detail.discountAmount)}</span></div>
                  )}
                  <div className="flex justify-between font-display font-bold text-white text-base pt-1">
                    <span>Total</span><span className="text-brand-300">{formatRupiah(detail.total)}</span>
                  </div>
                  {detail.paymentMethod === 'CASH' && (
                    <>
                      <div className="flex justify-between text-sm text-slate-400"><span>Dibayar</span><span>{formatRupiah(detail.amountPaid)}</span></div>
                      <div className="flex justify-between text-sm text-green-400 font-display font-semibold"><span>Kembalian</span><span>{formatRupiah(detail.changeAmount)}</span></div>
                    </>
                  )}
                </div>

                {detail.notes && (
                  <div className="border-t border-surface-border pt-3">
                    <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">Catatan</p>
                    <p className="text-sm text-slate-300">{detail.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdate} className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-display font-bold text-white">Edit Transaksi</h2>
              <button type="button" onClick={() => setEditTx(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Invoice</label>
                <input type="text" disabled value={editTx.invoiceNumber} className="input-field opacity-50 cursor-not-allowed font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                  <select
                    value={editTx.status}
                    onChange={e => setEditTx({ ...editTx, status: e.target.value })}
                    className="input-field"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Metode Bayar</label>
                  <select
                    value={editTx.paymentMethod}
                    onChange={e => setEditTx({ ...editTx, paymentMethod: e.target.value })}
                    className="input-field"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={editTx.notes || ''}
                  onChange={e => setEditTx({ ...editTx, notes: e.target.value })}
                  className="input-field"
                  placeholder="Opsional..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-border bg-surface-base/50 rounded-b-2xl">
              <button type="button" onClick={() => setEditTx(null)} className="btn-secondary">Batal</button>
              <button type="submit" disabled={submitLoading} className="btn-primary">
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl animate-bounce-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-display font-bold text-xl text-white mb-2">Hapus Transaksi?</h2>
              <p className="text-slate-400 text-sm mb-6">
                Tindakan ini tidak bisa dibatalkan. Menghapus transaksi akan mengembalikan stok barang yang terkait ke dalam sistem.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDelete}
                  disabled={submitLoading}
                  className="btn-primary !bg-red-500 hover:!bg-red-600 !border-red-500 w-full"
                >
                  {submitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Ya, Hapus'}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={submitLoading}
                  className="btn-secondary w-full"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
