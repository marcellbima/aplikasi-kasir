// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatRupiah, formatDate } from '../utils/format'
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  Loader2, BarChart3
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
    </div>
  )

  const weeklyChartData = data?.weeklyRevenue?.map(d => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
    revenue: d.revenue,
    tx: d.count,
  })) || []

  const kpis = [
    {
      label: 'Pendapatan Hari Ini',
      value: formatRupiah(data?.today?.revenue || 0),
      sub: `${data?.today?.transactions || 0} transaksi`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Total Produk',
      value: data?.totalProducts || 0,
      sub: 'produk aktif',
      icon: Package,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
    {
      label: 'Stok Menipis',
      value: data?.lowStockCount || 0,
      sub: 'perlu restock',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-slate-500 font-body text-sm mt-0.5">Ringkasan operasional hari ini</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`card p-5 border ${k.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-display font-medium text-slate-400">{k.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bg}`}>
                <k.icon className={`w-4.5 h-4.5 ${k.color}`} />
              </div>
            </div>
            <p className={`font-display font-bold text-2xl ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4.5 h-4.5 text-brand-400" />
            <h2 className="font-display font-bold text-white">Pendapatan 7 Hari</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}jt`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={(v) => [formatRupiah(v), 'Revenue']}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alert */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            <h2 className="font-display font-bold text-white">Stok Menipis</h2>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {(data?.lowStockProducts || []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Semua stok aman ✅</p>
            ) : (
              data.lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-DEFAULT border border-surface-border">
                  <div className="min-w-0">
                    <p className="text-sm font-display font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.rackLocation}</p>
                  </div>
                  <span className={`ml-2 shrink-0 text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${
                    p.stock === 0
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {p.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top products + recent transactions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-white mb-4">Produk Terlaris (Bulan Ini)</h2>
          <div className="space-y-3">
            {(data?.topProducts || []).map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-brand-600/20 flex items-center justify-center text-xs font-mono font-bold text-brand-400 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-white truncate">{p.productName}</p>
                  <p className="text-xs text-slate-500">{p._sum.quantity} terjual</p>
                </div>
                <p className="text-sm font-display font-bold text-brand-300 shrink-0">
                  {formatRupiah(p._sum.subtotal)}
                </p>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-white mb-4">Transaksi Terbaru</h2>
          <div className="space-y-2">
            {(data?.recentTransactions || []).map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-DEFAULT border border-surface-border">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-300 truncate">{tx.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{tx.user?.name} · {tx.items.reduce((s, i) => s + i.quantity, 0)} item</p>
                </div>
                <div className="ml-2 text-right shrink-0">
                  <p className="text-sm font-display font-bold text-brand-300">{formatRupiah(tx.total)}</p>
                  <p className="text-xs text-slate-600">{formatDate(tx.createdAt).split(',')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
