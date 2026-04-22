'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { getInitials, getStatusClass, getStatusLabel, formatDate } from '@/lib/utils'
import { Users, Plus, Search, X, Loader2 } from 'lucide-react'

export default function OperatorsPage() {
  const supabase = createClient()
  const [operators, setOperators] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as 'operator' | 'admin' | 'supervisor',
    function: '',
  })

  useEffect(() => {
    loadOperators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadOperators() {
    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .order('name')
    setOperators((data || []) as UserProfile[])
    setLoading(false)
  }

  async function handleCreate() {
    setSaving(true)
    // Create user via Supabase Auth with metadata
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          role: form.role,
        }
      }
    })
    if (error) {
      alert('Erro ao criar usuário: ' + error.message)
      setSaving(false)
      return
    }

    // Update profile with function field
    // Note: The trigger should create the profile, but we may need to wait
    setTimeout(async () => {
      await loadOperators()
      setShowModal(false)
      setSaving(false)
      setForm({ name: '', email: '', password: '', role: 'operator', function: '' })
    }, 1000)
  }

  const filtered = operators.filter(op =>
    op.name.toLowerCase().includes(search.toLowerCase()) ||
    op.role.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Operadores</h2>
          <p>Gerenciamento de operadores, administradores e supervisores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-operator">
          <Plus size={18} />
          Novo Operador
        </button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 400, marginBottom: 24 }}>
        <Search className="search-icon" />
        <input
          className="input-field"
          placeholder="Buscar por nome ou função..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="search-operators"
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th>Função</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state" style={{ padding: 40 }}>
                      <Users size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <h3>Nenhum operador encontrado</h3>
                      <p>Cadastre o primeiro operador clicando em &quot;Novo Operador&quot;</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(op => (
                  <tr key={op.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, var(--color-brand-700), var(--color-brand-500))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'white',
                          flexShrink: 0,
                        }}>
                          {getInitials(op.name)}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{op.name}</span>
                      </div>
                    </td>
                    <td>{op.function || '—'}</td>
                    <td>
                      <span className={`badge ${op.role === 'admin' ? 'badge-warning' : op.role === 'supervisor' ? 'badge-info' : 'badge-neutral'}`}>
                        {getStatusLabel(op.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(op.status)}`}>
                        {getStatusLabel(op.status)}
                      </span>
                    </td>
                    <td>{formatDate(op.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="modal-title">Novo Operador</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="input-label">Nome Completo</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="João da Silva" />
              </div>
              <div className="form-group">
                <label className="input-label">E-mail</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="joao@empresa.com" />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <input className="input-field" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label className="input-label">Perfil</label>
                <select className="select-field" value={form.role} onChange={e => setForm({...form, role: e.target.value as 'operator' | 'admin' | 'supervisor'})}>
                  <option value="operator">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Função</label>
                <input className="input-field" value={form.function} onChange={e => setForm({...form, function: e.target.value})} placeholder="Tratorista, Motorista..." />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password}>
                {saving ? <><Loader2 size={16} /> Salvando...</> : 'Criar Operador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
