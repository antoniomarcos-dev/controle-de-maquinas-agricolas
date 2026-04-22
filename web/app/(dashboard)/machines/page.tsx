'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Machine } from '@/lib/types'
import { getStatusClass, getStatusLabel, formatNumber } from '@/lib/utils'
import { Cog, Plus, Search, X, Loader2, AlertTriangle } from 'lucide-react'

export default function MachinesPage() {
  const supabase = createClient()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    equipment_type: '',
    model: '',
    color: '',
    internal_number: '',
    maintenance_limit: '250',
  })

  useEffect(() => { loadMachines() }, [])

  async function loadMachines() {
    const { data } = await supabase.from('machines').select('*').order('name')
    setMachines((data || []) as Machine[])
    setLoading(false)
  }

  async function handleCreate() {
    setSaving(true)
    const { error } = await supabase.from('machines').insert({
      name: form.name,
      equipment_type: form.equipment_type,
      model: form.model,
      color: form.color || null,
      internal_number: form.internal_number,
      maintenance_limit: parseFloat(form.maintenance_limit) || 250,
    })
    if (error) {
      alert('Erro: ' + error.message)
      setSaving(false)
      return
    }
    await loadMachines()
    setShowModal(false)
    setSaving(false)
    setForm({ name: '', equipment_type: '', model: '', color: '', internal_number: '', maintenance_limit: '250' })
  }

  const filtered = machines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.internal_number.toLowerCase().includes(search.toLowerCase()) ||
    m.model.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Máquinas</h2>
          <p>Cadastro e controle de máquinas e equipamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-machine">
          <Plus size={18} /> Nova Máquina
        </button>
      </div>

      <div className="search-bar" style={{ maxWidth: 400, marginBottom: 24 }}>
        <Search className="search-icon" />
        <input className="input-field" placeholder="Buscar por nome, modelo ou número..." value={search} onChange={e => setSearch(e.target.value)} id="search-machines" />
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>Nº Interno</th>
                <th>Horímetro</th>
                <th>Limite</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state" style={{ padding: 40 }}>
                    <Cog size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <h3>Nenhuma máquina cadastrada</h3>
                    <p>Cadastre a primeira máquina clicando em &quot;Nova Máquina&quot;</p>
                  </div>
                </td></tr>
              ) : filtered.map(m => {
                const needsMaint = m.hourmeter_current >= m.maintenance_limit
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {needsMaint && <AlertTriangle size={16} color="var(--color-danger-400)" />}
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{m.equipment_type}</td>
                    <td>{m.model}</td>
                    <td><span className="badge badge-neutral">{m.internal_number}</span></td>
                    <td>
                      <span style={{ color: needsMaint ? 'var(--color-danger-400)' : 'var(--color-text-secondary)', fontWeight: needsMaint ? 600 : 400 }}>
                        {formatNumber(m.hourmeter_current, 1)}h
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{formatNumber(m.maintenance_limit, 0)}h</td>
                    <td>
                      <span className={`badge ${needsMaint ? 'badge-danger' : getStatusClass(m.status)}`}>
                        {needsMaint ? '⚠ Manutenção' : getStatusLabel(m.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="modal-title">Nova Máquina</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="input-label">Nome</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Trator John Deere 6110J" />
              </div>
              <div className="form-group">
                <label className="input-label">Tipo</label>
                <select className="select-field" value={form.equipment_type} onChange={e => setForm({...form, equipment_type: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="trator">Trator</option>
                  <option value="colheitadeira">Colheitadeira</option>
                  <option value="pulverizador">Pulverizador</option>
                  <option value="plantadeira">Plantadeira</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Modelo</label>
                <input className="input-field" value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="6110J" />
              </div>
              <div className="form-group">
                <label className="input-label">Cor</label>
                <input className="input-field" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="Verde" />
              </div>
              <div className="form-group">
                <label className="input-label">Nº Interno</label>
                <input className="input-field" value={form.internal_number} onChange={e => setForm({...form, internal_number: e.target.value})} placeholder="TR-001" />
              </div>
              <div className="form-group full-width">
                <label className="input-label">Limite de Manutenção (horas)</label>
                <input className="input-field" type="number" value={form.maintenance_limit} onChange={e => setForm({...form, maintenance_limit: e.target.value})} placeholder="250" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.equipment_type || !form.model || !form.internal_number}>
                {saving ? <><Loader2 size={16} /> Salvando...</> : 'Cadastrar Máquina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
