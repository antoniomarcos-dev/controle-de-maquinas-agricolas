'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Tractor, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f0d 0%, #111916 50%, #0a1510 100%)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="glass-card page-enter" style={{
        padding: 48,
        maxWidth: 440,
        width: '100%',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 8px 32px rgba(34,197,94,0.25)',
          }}>
            <Tractor size={36} color="white" />
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 4,
          }}>
            Ceres Conecta
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
          }}>
            Sistema de Controle Operacional
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="input-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="admin@ceresconecta.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="input-label" htmlFor="password">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--color-danger-400)',
              marginTop: 16,
              marginBottom: 8,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            id="btn-login"
            style={{ width: '100%', marginTop: 24 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" style={{ border: 'none' }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginTop: 32,
        }}>
          © 2026 Ceres Conecta Hub — Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
