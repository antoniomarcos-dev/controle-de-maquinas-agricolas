'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { useConnectivity } from '@/lib/connectivity'
import {
  setCacheData,
  getCacheData,
} from '@/lib/offline-cache'
import {
  Users,
  Cog,
  ClipboardList,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Truck,
} from 'lucide-react'
import { formatDate, formatNumber, getStatusClass, getStatusLabel, formatTime } from '@/lib/utils'
import type { ServiceOrder, Machine, Journey, UserProfile } from '@/lib/types'

interface DashboardStats {
  totalOperators: number
  totalMachines: number
  totalVehicles: number
  activeJourneys: number
  openServices: number
  finishedServicesToday: number
  maintenanceAlerts: number
  totalOvertimeToday: number
}

const CACHE_KEY_STATS = 'dashboard-stats'
const CACHE_KEY_SERVICES = 'dashboard-recent-services'
const CACHE_KEY_ALERTS = 'dashboard-alerts'
const CACHE_KEY_OPERATORS = 'dashboard-active-operators'

export default function DashboardPage() {
  const { profile } = useAuth()
  useConnectivity()
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats>({
    totalOperators: 0,
    totalMachines: 0,
    totalVehicles: 0,
    activeJourneys: 0,
    openServices: 0,
    finishedServicesToday: 0,
    maintenanceAlerts: 0,
    totalOvertimeToday: 0,
  })
  const [recentServices, setRecentServices] = useState<ServiceOrder[]>([])
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Machine[]>([])
  const [activeOperators, setActiveOperators] = useState<(Journey & { operator: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)

  const loadDashboard = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]

    // Try to load from network
    if (navigator.onLine) {
      try {
        const [
          operatorsRes,
          machinesRes,
          vehiclesRes,
          journeysRes,
          openServicesRes,
          finishedServicesRes,
          recentServicesRes,
          alertsRes,
          activeOpsRes,
        ] = await Promise.all([
          supabase.from('users_profile').select('id', { count: 'exact' }).eq('role', 'operator'),
          supabase.from('machines').select('id', { count: 'exact' }),
          supabase.from('vehicles').select('id', { count: 'exact' }),
          supabase.from('journeys').select('id', { count: 'exact' }).eq('date', today).is('garage_return_at', null),
          supabase.from('service_orders').select('id', { count: 'exact' }).eq('status', 'open'),
          supabase.from('service_orders').select('id', { count: 'exact' }).eq('date', today).eq('status', 'finished'),
          supabase.from('service_orders').select('*, operator:users_profile(*), machine:machines(*), vehicle:vehicles(*)').order('created_at', { ascending: false }).limit(8),
          supabase.from('machines').select('*').gte('hourmeter_current', 0),
          supabase.from('journeys').select('*, operator:users_profile(*)').eq('date', today).is('garage_return_at', null).order('garage_out_at', { ascending: false }),
        ])

        const machinesList = (alertsRes.data || []) as Machine[]
        const alertMachines = machinesList.filter(m => m.hourmeter_current >= m.maintenance_limit)

        const newStats: DashboardStats = {
          totalOperators: operatorsRes.count || 0,
          totalMachines: machinesRes.count || 0,
          totalVehicles: vehiclesRes.count || 0,
          activeJourneys: journeysRes.count || 0,
          openServices: openServicesRes.count || 0,
          finishedServicesToday: finishedServicesRes.count || 0,
          maintenanceAlerts: alertMachines.length,
          totalOvertimeToday: 0,
        }
        const services = (recentServicesRes.data || []) as ServiceOrder[]
        const ops = (activeOpsRes.data || []) as (Journey & { operator: UserProfile })[]

        setStats(newStats)
        setRecentServices(services)
        setMaintenanceAlerts(alertMachines)
        setActiveOperators(ops)
        setFromCache(false)

        // Cache all data
        setCacheData('dashboard', { key: CACHE_KEY_STATS }, [newStats]).catch(() => {})
        setCacheData('dashboard', { key: CACHE_KEY_SERVICES }, services).catch(() => {})
        setCacheData('dashboard', { key: CACHE_KEY_ALERTS }, alertMachines).catch(() => {})
        setCacheData('dashboard', { key: CACHE_KEY_OPERATORS }, ops).catch(() => {})

        setLoading(false)
        return
      } catch {
        // Network error — fall through to cache
      }
    }

    // Load from cache
    const [cachedStats, cachedServices, cachedAlerts, cachedOps] = await Promise.all([
      getCacheData('dashboard', { key: CACHE_KEY_STATS }),
      getCacheData('dashboard', { key: CACHE_KEY_SERVICES }),
      getCacheData('dashboard', { key: CACHE_KEY_ALERTS }),
      getCacheData('dashboard', { key: CACHE_KEY_OPERATORS }),
    ])

    if (cachedStats && cachedStats.length > 0) setStats(cachedStats[0] as DashboardStats)
    if (cachedServices) setRecentServices(cachedServices as ServiceOrder[])
    if (cachedAlerts) setMaintenanceAlerts(cachedAlerts as Machine[])
    if (cachedOps) setActiveOperators(cachedOps as (Journey & { operator: UserProfile })[])
    setFromCache(true)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadDashboard()

    // Refresh when sync completes
    const handleSync = () => loadDashboard()
    window.addEventListener('ceres:data-synced', handleSync)
    return () => window.removeEventListener('ceres:data-synced', handleSync)
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{greeting()}, {profile?.name?.split(' ')[0]} 👋</h2>
          <p>
            Aqui está o resumo das operações de hoje — {formatDate(new Date().toISOString())}
            {fromCache && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-accent-400)', fontWeight: 500 }}>
                📦 Dados do cache
              </span>
            )}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="var(--color-brand-400)" />
            </div>
            {stats.activeJourneys > 0 && <div className="pulse-dot active" />}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-brand-400)' }}>{stats.activeJourneys}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Operadores em Campo</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={22} color="#60a5fa" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>{stats.openServices}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Serviços em Aberto</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="var(--color-brand-400)" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.finishedServicesToday}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Serviços Concluídos Hoje</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stats.maintenanceAlerts > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} color={stats.maintenanceAlerts > 0 ? 'var(--color-danger-400)' : 'var(--color-accent-400)'} />
            </div>
            {stats.maintenanceAlerts > 0 && <div className="pulse-dot danger" />}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: stats.maintenanceAlerts > 0 ? 'var(--color-danger-400)' : 'var(--color-accent-400)' }}>{stats.maintenanceAlerts}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Alertas de Manutenção</div>
        </div>
      </div>

      {/* Second Row: Quick Stats */}
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="kpi-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={20} color="var(--color-text-muted)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Operadores</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{stats.totalOperators}</div>
        </div>
        <div className="kpi-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Cog size={20} color="var(--color-text-muted)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Máquinas</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{stats.totalMachines}</div>
        </div>
        <div className="kpi-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Truck size={20} color="var(--color-text-muted)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Veículos</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{stats.totalVehicles}</div>
        </div>
        <div className="kpi-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={20} color="var(--color-text-muted)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Hora Atual</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid-2">
        {/* Recent Services */}
        <div className="glass-card" style={{ padding: 24, overflow: 'hidden' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={18} color="var(--color-brand-400)" />
            Serviços Recentes
          </h3>
          {recentServices.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p>Nenhum serviço registrado ainda</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operador</th>
                    <th>Equipamento</th>
                    <th>Local</th>
                    <th>Status</th>
                    <th>Início</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {s.operator?.name || '—'}
                      </td>
                      <td>
                        {s.machine?.name || s.vehicle?.plate || '—'}
                      </td>
                      <td>{s.location || '—'}</td>
                      <td>
                        <span className={`badge ${getStatusClass(s.status)}`}>
                          {getStatusLabel(s.status)}
                        </span>
                      </td>
                      <td>{formatTime(s.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Operators */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="var(--color-brand-400)" />
              Operadores Ativos
            </h3>
            {activeOperators.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>
                Nenhum operador em campo agora
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeOperators.map(j => (
                  <div key={j.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--color-surface-700)',
                    borderRadius: 12,
                  }}>
                    <div className="pulse-dot active" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{j.operator?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Saiu às {formatTime(j.garage_out_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Alerts */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="var(--color-danger-400)" />
              Alertas de Manutenção
            </h3>
            {maintenanceAlerts.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>
                ✅ Nenhuma máquina em alerta
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {maintenanceAlerts.map(m => (
                  <div key={m.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-danger-400)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.internal_number}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger-400)' }}>
                        {formatNumber(m.hourmeter_current, 0)}h
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        Limite: {formatNumber(m.maintenance_limit, 0)}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
