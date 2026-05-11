'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useConnectivity } from '@/lib/connectivity'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Cog,
  Truck,
  ClipboardList,
  Wrench,
  BarChart3,
  LogOut,
  Menu,
  X,
  Tractor,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Operadores', href: '/operators', icon: Users },
  { label: 'Máquinas', href: '/machines', icon: Cog },
  { label: 'Veículos', href: '/vehicles', icon: Truck },
  { label: 'Serviços', href: '/services', icon: ClipboardList },
  { label: 'Manutenção', href: '/maintenance', icon: Wrench },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { status, pendingCount } = useConnectivity()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="btn btn-ghost"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
          display: 'none',
        }}
        id="sidebar-toggle"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>

      {/* Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Tractor size={22} color="white" />
          </div>
          <div>
            <h1>Ceres Conecta</h1>
            <span>Controle Operacional</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Principal</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                id={`nav-${item.href.replace('/', '')}`}
              >
                <Icon className="icon" size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Connectivity Status */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-surface-600)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
        }}>
          {status === 'online' ? <Wifi size={16} color="var(--color-brand-400)" /> : status === 'syncing' ? <Wifi size={16} color="#60a5fa" /> : <WifiOff size={16} color="var(--color-danger-400)" />}
          <span style={{ color: status === 'online' ? 'var(--color-brand-400)' : status === 'syncing' ? '#60a5fa' : 'var(--color-danger-400)', fontWeight: 500 }}>
            {status === 'online' ? 'Online' : status === 'syncing' ? 'Sincronizando...' : 'Offline'}
          </span>
          {pendingCount > 0 && (
            <span style={{ marginLeft: 'auto', background: 'rgba(234,179,8,0.2)', color: '#facc15', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
              {pendingCount}
            </span>
          )}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {profile ? getInitials(profile.name) : '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.name || 'Carregando...'}</div>
            <div className="sidebar-user-role">
              {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'supervisor' ? 'Supervisor' : 'Operador'}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={signOut}
            title="Sair"
            id="btn-logout"
            style={{ padding: 8 }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}
