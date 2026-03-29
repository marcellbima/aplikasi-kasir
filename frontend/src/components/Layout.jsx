// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  Users, LogOut, Zap, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/pos',          icon: ShoppingCart,    label: 'Kasir',         roles: ['ADMIN','KASIR'] },
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     roles: ['ADMIN'] },
  { to: '/products',     icon: Package,         label: 'Produk',        roles: ['ADMIN'] },
  { to: '/transactions', icon: Receipt,         label: 'Transaksi',     roles: ['ADMIN','KASIR'] },
  { to: '/users',        icon: Users,           label: 'Pengguna',      roles: ['ADMIN'] },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Sampai jumpa!')
    navigate('/login')
  }

  const visible = navItems.filter((n) => n.roles.includes(user?.role))

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-surface-border bg-surface-card shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold text-white text-base leading-tight">ElektroKasir</p>
              <p className="text-xs text-slate-500 font-body">Point of Sale</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visible.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-all duration-150 group ` +
                (isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-surface-hover hover:text-slate-200 border border-transparent')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={2} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-DEFAULT mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-display font-bold text-brand-300">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-slate-200 truncate">{user?.name}</p>
              <span className={`text-xs font-mono ${user?.role === 'ADMIN' ? 'text-amber-400' : 'text-brand-400'}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
