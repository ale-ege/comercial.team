'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  active: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar')
      setUsers(data.users || [])
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ email: '', name: '', password: '' })
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditingId(u.id)
    setForm({ email: u.email, name: u.name, password: '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const body: { name: string; password?: string } = { name: form.name }
        if (form.password) body.password = form.password
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar')
        setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...data.user } : u)))
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao criar')
        setUsers((prev) => [...prev, data.user])
      }
      setModalOpen(false)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: User) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: data.user.active } : x)))
    } catch (e: any) {
      setError(e.message || 'Erro')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este usuário?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir')
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir')
    }
  }

  return (
    <SidebarLayout currentModule="configuracoes">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <div className="flex gap-2">
            <Link href="/configuracoes">
              <Button variant="secondary">Voltar às configurações</Button>
            </Link>
            <Button onClick={openCreate}>Novo usuário</Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nenhum usuário cadastrado. Crie o primeiro para fazer login na plataforma.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${u.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        {u.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingId ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!editingId}
                />
                <Input
                  label={editingId ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  minLength={6}
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
