'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ServiceOrder } from '@/lib/types'
import { getStatusClass, getStatusLabel, formatDateTime, formatTime, formatNumber } from '@/lib/utils'
import { ClipboardList, Search, Filter, MapPin, Clock } from 'lucide-react'

export default function ServicesPage() {
  const supabase = createClient()
  const [services, setServices] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<ServiceOrder | null>(null)

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    const { data } = await supabase
      .from('service_orders')
      .select('*, operator:users_profile(*), machine:machines(*), vehicle:vehicles(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    setServices((data || []) as ServiceOrder[])
    setLoading(false)
  }

  const filtered = services.filter(s => {
    const matchSearch =
      s.operator?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.machine?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const openCount = services.filter(s => s.status === 'open').length
  const finishedCount = services.filter(s => s.status === 'finished').length

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Ordens de Serviço</h2>
          <p>Acompanhamento de todos os serviços registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="badge badge-info" style={{ fontSize: 14, padding: '8px 16px' }}>{openCount} Abertos</div>
          <div className="badge badge-success" style={{ fontSize: 14, padding: '8px 16px' }}>{finishedCount} Finalizados</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 280 }}>
          <Search className="search-icon" />
          <input className="input-field" placeholder="Buscar operador, máquina, local..." value={search} onChange={e => setSearch(e.target.value)} id="search-services" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={16} color="var(--color-text-muted)" />
          {['all', 'open', 'finished'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Todos' : getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Operador</th><th>Equipamento</th><th>Local</th><th>Início</th><th>Fim</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state" style={{ padding: 40 }}>
                    <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <h3>Nenhum serviço encontrado</h3>
                  </div>
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} onClick={() => setSelectedService(s)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.operator?.name || '—'}</td>
                  <td>{s.machine?.name || s.vehicle?.plate || '—'}</td>
                  <td>{s.location ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="var(--color-brand-400)" />{s.location}</span> : '—'}</td>
                  <td>{formatTime(s.started_at)}</td>
                  <td>{formatTime(s.finished_at)}</td>
                  <td><span className={`badge ${getStatusClass(s.status)}`}>{getStatusLabel(s.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 className="modal-title">Detalhes do Serviço</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Operador</div><div style={{ fontWeight: 500 }}>{selectedService.operator?.name}</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Equipamento</div><div style={{ fontWeight: 500 }}>{selectedService.machine?.name || selectedService.vehicle?.plate || '—'}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Início</div><div>{formatDateTime(selectedService.started_at)}</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Fim</div><div>{formatDateTime(selectedService.finished_at)}</div></div>
              </div>
              {selectedService.location && <div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Local</div><div>{selectedService.location}</div></div>}
              {selectedService.notes && <div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Observações</div><div style={{ background: 'var(--color-surface-700)', padding: 12, borderRadius: 10 }}>{selectedService.notes}</div></div>}
            </div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setSelectedService(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
