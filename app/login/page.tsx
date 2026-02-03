'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        if (data.error && String(data.error).includes('Nenhum usuário cadastrado')) {
          setShowSetup(true)
        }
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [email, password, router])

  const handleSetup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [email, password, name, router])

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: 32 }}>
        {!showSetup ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>Entrar</h1>
            <p style={{ color: '#4b5563', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Acesso à plataforma</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              {error && (
                <p style={{ fontSize: 14, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '10px 16px', background: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>Criar primeira conta</h1>
            <p style={{ color: '#4b5563', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              Não há usuários cadastrados. Crie a primeira conta para acessar.
            </p>
            <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Senha (mín. 6 caracteres)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              {error && (
                <p style={{ fontSize: 14, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '10px 16px', background: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Criando...' : 'Criar conta e entrar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowSetup(false); setError(''); setName('') }}
                style={{ width: '100%', padding: 8, fontSize: 14, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Voltar ao login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
