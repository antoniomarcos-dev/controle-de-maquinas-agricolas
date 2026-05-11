'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/lib/types'
import { getStatusClass, getStatusLabel, formatNumber } from '@/lib/utils'
import { setCacheData, getCacheData } from '@/lib/offline-cache'
import { cachedMutation } from '@/lib/cached-supabase'
import { Truck, Plus, Search, X, Loader2 } from 'lucide-react'

const CK = 'vehicles-list'

export default function VehiclesPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [form, setForm] = useState({ plate: '', vehicle_type: '', model: '' })

  const load = useCallback(async () => {
    if (navigator.onLine) {
      try {
        const { data } = await supabase.from('vehicles').select('*').order('plate')
        const l = (data || []) as Vehicle[]; setVehicles(l); setFromCache(false)
        setCacheData('vehicles', { key: CK }, l).catch(() => {}); setLoading(false); return
      } catch { /* cache */ }
    }
    const c = await getCacheData('vehicles', { key: CK })
    if (c) { setVehicles(c as Vehicle[]); setFromCache(true) }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load(); const h = () => load(); window.addEventListener('ceres:data-synced', h); return () => window.removeEventListener('ceres:data-synced', h) }, [load])

  async function handleCreate() {
    setSaving(true)
    const r = await cachedMutation({ table: 'vehicles', operation: 'insert', payload: { plate: form.plate.toUpperCase(), vehicle_type: form.vehicle_type, model: form.model } })
    if (!r.success) { alert('Erro: ' + r.error); setSaving(false); return }
    if (r.queued) alert('✅ Veículo salvo localmente.')
    await load(); setShowModal(false); setSaving(false); setForm({ plate: '', vehicle_type: '', model: '' })
  }

  const filtered = vehicles.filter(v => v.plate.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()) || v.vehicle_type.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div>
      <div className="page-header"><div><h2>Veículos</h2><p>Cadastro e controle de veículos{fromCache && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-accent-400)', fontWeight: 500 }}>📦 Cache</span>}</p></div><button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-vehicle"><Plus size={18} /> Novo Veículo</button></div>
      <div className="search-bar" style={{ maxWidth: 400, marginBottom: 24 }}><Search className="search-icon" /><input className="input-field" placeholder="Buscar por placa, modelo..." value={search} onChange={e => setSearch(e.target.value)} id="search-vehicles" /></div>
      <div className="glass-card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Placa</th><th>Tipo</th><th>Modelo</th><th>Quilometragem</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? (<tr><td colSpan={5}><div className="empty-state" style={{ padding: 40 }}><Truck size={48} style={{ opacity: 0.2, marginBottom: 12 }} /><h3>Nenhum veículo</h3></div></td></tr>) :
        filtered.map(v => (<tr key={v.id}><td><span style={{ fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>{v.plate}</span></td><td style={{ textTransform: 'capitalize' }}>{v.vehicle_type}</td><td>{v.model}</td><td>{formatNumber(v.mileage_current, 0)} km</td><td><span className={`badge ${getStatusClass(v.status)}`}>{getStatusLabel(v.status)}</span></td></tr>))}
      </tbody></table></div></div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h3 className="modal-title">Novo Veículo</h3><button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button></div>
        <div className="form-grid"><div className="form-group"><label className="input-label">Placa</label><input className="input-field" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} placeholder="ABC-1234" style={{ textTransform: 'uppercase' }} /></div><div className="form-group"><label className="input-label">Tipo</label><select className="select-field" value={form.vehicle_type} onChange={e => setForm({...form, vehicle_type: e.target.value})}><option value="">Selecione...</option><option value="pickup">Pickup</option><option value="caminhão">Caminhão</option><option value="utilitário">Utilitário</option><option value="carro">Carro</option><option value="outro">Outro</option></select></div><div className="form-group full-width"><label className="input-label">Modelo</label><input className="input-field" value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Toyota Hilux 2023" /></div></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.plate || !form.vehicle_type || !form.model}>{saving ? <><Loader2 size={16} /> Salvando...</> : 'Cadastrar Veículo'}</button></div></div></div>)}
    </div>
  )
}
