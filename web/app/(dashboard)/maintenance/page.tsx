'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Machine } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import { setCacheData, getCacheData } from '@/lib/offline-cache'
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'

const CK = 'maintenance-machines'

export default function MaintenancePage() {
  const supabase = createClient()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)

  const load = useCallback(async () => {
    if (navigator.onLine) {
      try {
        const { data } = await supabase.from('machines').select('*').order('hourmeter_current', { ascending: false })
        const l = (data || []) as Machine[]; setMachines(l); setFromCache(false)
        setCacheData('machines', { key: CK }, l).catch(() => {}); setLoading(false); return
      } catch { /* cache */ }
    }
    const c = await getCacheData('machines', { key: CK })
    if (c) { setMachines(c as Machine[]); setFromCache(true) }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load(); const h = () => load(); window.addEventListener('ceres:data-synced', h); return () => window.removeEventListener('ceres:data-synced', h) }, [load])

  const alerts = machines.filter(m => m.hourmeter_current >= m.maintenance_limit)
  const warning = machines.filter(m => m.hourmeter_current >= m.maintenance_limit * 0.8 && m.hourmeter_current < m.maintenance_limit)
  const ok = machines.filter(m => m.hourmeter_current < m.maintenance_limit * 0.8)
  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div>
      <div className="page-header"><div><h2>Manutenção</h2><p>Alertas e controle de manutenção preventiva{fromCache && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-accent-400)', fontWeight: 500 }}>📦 Cache</span>}</p></div></div>
      <div className="dashboard-grid" style={{ marginBottom: 32 }}>
        <div className="kpi-card"><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><AlertTriangle size={22} color="var(--color-danger-400)" /><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Manutenção Urgente</span></div><div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-danger-400)' }}>{alerts.length}</div></div>
        <div className="kpi-card"><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><AlertTriangle size={22} color="var(--color-accent-400)" /><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Atenção (80%+)</span></div><div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-accent-400)' }}>{warning.length}</div></div>
        <div className="kpi-card"><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><CheckCircle2 size={22} color="var(--color-brand-400)" /><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Em Dia</span></div><div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-brand-400)' }}>{ok.length}</div></div>
      </div>
      {alerts.length > 0 && (<div style={{ marginBottom: 24 }}><h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-danger-400)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} /> Manutenção Urgente</h3><div style={{ display: 'grid', gap: 12 }}>{alerts.map(m => <MachineCard key={m.id} machine={m} variant="danger" />)}</div></div>)}
      {warning.length > 0 && (<div style={{ marginBottom: 24 }}><h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-accent-400)' }}>⚠️ Atenção — Próximo do Limite</h3><div style={{ display: 'grid', gap: 12 }}>{warning.map(m => <MachineCard key={m.id} machine={m} variant="warning" />)}</div></div>)}
      {ok.length > 0 && (<div><h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-brand-400)' }}>✅ Em Dia</h3><div style={{ display: 'grid', gap: 12 }}>{ok.map(m => <MachineCard key={m.id} machine={m} variant="ok" />)}</div></div>)}
    </div>
  )
}

function MachineCard({ machine: m, variant }: { machine: Machine; variant: 'danger' | 'warning' | 'ok' }) {
  const pct = Math.min(100, (m.hourmeter_current / m.maintenance_limit) * 100)
  const barColor = variant === 'danger' ? 'var(--color-danger-500)' : variant === 'warning' ? 'var(--color-accent-500)' : 'var(--color-brand-500)'
  const borderColor = variant === 'danger' ? 'rgba(239,68,68,0.2)' : variant === 'warning' ? 'rgba(234,179,8,0.2)' : 'var(--color-glass-border)'
  return (
    <div className="glass-card" style={{ padding: 20, borderColor }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><div><div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.internal_number} · {m.model}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, fontSize: 18, color: barColor }}>{formatNumber(m.hourmeter_current, 1)}h</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>de {formatNumber(m.maintenance_limit, 0)}h</div></div></div>
      <div style={{ height: 6, background: 'var(--color-surface-600)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} /></div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, textAlign: 'right' }}>{variant === 'danger' ? `Excedeu em ${formatNumber(m.hourmeter_current - m.maintenance_limit, 1)}h` : `Restam ${formatNumber(m.maintenance_limit - m.hourmeter_current, 1)}h`}</div>
    </div>
  )
}
