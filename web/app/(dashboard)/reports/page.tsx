'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, formatMinutesToHours, todayISO } from '@/lib/utils'
import { BarChart3, Calendar, Users, Cog, Download } from 'lucide-react'

interface OperatorRow {
  operator_id: string
  operator_name: string
  total_journeys: number
  total_services: number
  total_hours_worked: number
  total_overtime_minutes: number
}

interface MachineRow {
  machine_id: string
  machine_name: string
  internal_number: string
  total_services: number
  total_hours_used: number
  hourmeter_current: number
  needs_maintenance: boolean
}

export default function ReportsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'operators' | 'machines'>('operators')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(todayISO())
  const [operatorData, setOperatorData] = useState<OperatorRow[]>([])
  const [machineData, setMachineData] = useState<MachineRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadReport() }, [tab, startDate, endDate])

  async function loadReport() {
    setLoading(true)
    if (tab === 'operators') {
      const { data } = await supabase.rpc('fn_operator_report', {
        p_start_date: startDate,
        p_end_date: endDate,
      })
      setOperatorData((data || []) as OperatorRow[])
    } else {
      const { data } = await supabase.rpc('fn_machine_report', {
        p_start_date: startDate,
        p_end_date: endDate,
      })
      setMachineData((data || []) as MachineRow[])
    }
    setLoading(false)
  }

  function exportCSV() {
    let csv = ''
    if (tab === 'operators') {
      csv = 'Operador,Jornadas,Serviços,Horas Trabalhadas,Horas Extras\n'
      operatorData.forEach(r => {
        csv += `${r.operator_name},${r.total_journeys},${r.total_services},${r.total_hours_worked.toFixed(1)},${formatMinutesToHours(r.total_overtime_minutes)}\n`
      })
    } else {
      csv = 'Máquina,Nº Interno,Serviços,Horas Utilizadas,Horímetro Atual,Manutenção\n'
      machineData.forEach(r => {
        csv += `${r.machine_name},${r.internal_number},${r.total_services},${r.total_hours_used.toFixed(1)},${r.hourmeter_current},${r.needs_maintenance ? 'Sim' : 'Não'}\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${tab}_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Relatórios</h2>
          <p>Análise de produtividade por operador e máquina</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV} id="btn-export-csv">
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${tab === 'operators' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('operators')}>
          <Users size={16} /> Por Operador
        </button>
        <button className={`btn ${tab === 'machines' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('machines')}>
          <Cog size={16} /> Por Máquina
        </button>
      </div>

      {/* Date Filters */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={18} color="var(--color-text-muted)" />
          <div className="form-group" style={{ gap: 4 }}>
            <label className="input-label">Data Início</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 180 }} />
          </div>
          <div className="form-group" style={{ gap: 4 }}>
            <label className="input-label">Data Fim</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 180 }} />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: '30vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : tab === 'operators' ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Operador</th><th>Jornadas</th><th>Serviços</th><th>Horas Trabalhadas</th><th>Horas Extras</th></tr></thead>
              <tbody>
                {operatorData.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state" style={{ padding: 40 }}>
                      <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <h3>Sem dados no período</h3>
                      <p>Ajuste o filtro de datas para visualizar os relatórios</p>
                    </div>
                  </td></tr>
                ) : operatorData.map(r => (
                  <tr key={r.operator_id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.operator_name}</td>
                    <td>{r.total_journeys}</td>
                    <td>{r.total_services}</td>
                    <td>{formatNumber(r.total_hours_worked, 1)}h</td>
                    <td>
                      <span className={`badge ${r.total_overtime_minutes > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                        {formatMinutesToHours(r.total_overtime_minutes)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Máquina</th><th>Nº Interno</th><th>Serviços</th><th>Horas Utilizadas</th><th>Horímetro</th><th>Manutenção</th></tr></thead>
              <tbody>
                {machineData.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state" style={{ padding: 40 }}>
                      <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <h3>Sem dados no período</h3>
                    </div>
                  </td></tr>
                ) : machineData.map(r => (
                  <tr key={r.machine_id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.machine_name}</td>
                    <td><span className="badge badge-neutral">{r.internal_number}</span></td>
                    <td>{r.total_services}</td>
                    <td>{formatNumber(r.total_hours_used, 1)}h</td>
                    <td>{formatNumber(r.hourmeter_current, 1)}h</td>
                    <td>
                      <span className={`badge ${r.needs_maintenance ? 'badge-danger' : 'badge-success'}`}>
                        {r.needs_maintenance ? '⚠ Necessária' : 'Em dia'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
