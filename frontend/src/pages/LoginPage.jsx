// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuthStore()
  const [form, setForm] = useState({ id_user: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) navigate('/pos', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.id_user || !form.password) { setError('ID dan password wajib diisi.'); return }
    const result = await login(form.id_user, form.password)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradient blob */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

        {/* Logo */}
        <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/60">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">ElektroKasir</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl text-white leading-tight mb-6">
            Kasir Modern<br />
            <span className="text-brand-400">Toko Elektronik</span>
          </h1>
          <p className="text-slate-400 font-body text-lg leading-relaxed max-w-sm">
            Sistem POS terintegrasi untuk toko elektronik kamu. Transaksi cepat, stok akurat, laporan real-time.
          </p>
        </div>

        {/* Feature chips */}
        <div className={`relative space-y-3 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { label: 'Checkout < 90 detik', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
            { label: 'Scan barcode real-time', color: 'bg-brand-500/10 border-brand-500/20 text-brand-400' },
            { label: 'Laporan & analitik', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
          ].map((f) => (
            <div key={f.label} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-display font-medium mr-3 ${f.color}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-white">ElektroKasir</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-white mb-2">Selamat datang 👋</h2>
            <p className="text-slate-400 font-body">Masuk ke akun kasir atau admin kamu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">ID Pengguna</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.id_user}
                  onChange={(e) => setForm({ ...form, id_user: e.target.value })}
                  placeholder="Ketik ID (misal: admin)"
                  className="input pl-10"
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input pl-10 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600 font-body">
            ElektroKasir v1.0.0 &nbsp;·&nbsp; © 2025
          </p>
        </div>
      </div>
    </div>
  )
}
