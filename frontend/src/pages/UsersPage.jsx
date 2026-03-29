// src/pages/UsersPage.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Users, Loader2, X, Shield, User } from 'lucide-react'
import { formatDateShort } from '../utils/format'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'KASIR', isActive: true }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data.data)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive })
    setModal(u)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/users', form)
        toast.success('User ditambahkan!')
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/users/${modal.id}`, payload)
        toast.success('User diperbarui!')
      }
      setModal(null)
      fetchUsers()
    } catch { }
    setSaving(false)
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Pengguna</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} akun terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin inline mr-2" />Memuat…
          </div>
        ) : users.map(u => (
          <div key={u.id} className="card p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${u.role === 'ADMIN' ? 'bg-amber-500/15' : 'bg-brand-500/15'
              }`}>
              {u.role === 'ADMIN'
                ? <Shield className="w-5 h-5 text-amber-400" />
                : <User className="w-5 h-5 text-brand-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-display font-semibold text-white truncate">{u.name}</p>
                {!u.isActive && (
                  <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-xs">Nonaktif</span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge text-xs ${u.role === 'ADMIN'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                  {u.role}
                </span>
                <span className="text-xs text-slate-600">Bergabung {formatDateShort(u.createdAt)}</span>
              </div>
            </div>
            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-500 hover:text-brand-400 transition-all shrink-0">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-display font-bold text-white">
                {modal === 'create' ? 'Tambah User' : `Edit: ${modal.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Nama Lengkap *</label>
                <input className="input" required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="label">ID Pengguna *</label>
                <input className="input" type="text" required value={form.email} onChange={e => f('email', e.target.value.replace(/\s+/g, '').toLowerCase())} placeholder="budi123" />
              </div>
              <div>
                <label className="label">{modal === 'create' ? 'Password *' : 'Password Baru (kosongkan jika tidak diubah)'}</label>
                <input
                  className="input"
                  type="password"
                  required={modal === 'create'}
                  value={form.password}
                  onChange={e => f('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                    <option value="KASIR">KASIR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                {modal !== 'create' && (
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.isActive} onChange={e => f('isActive', e.target.value === 'true')}>
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                )}
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
