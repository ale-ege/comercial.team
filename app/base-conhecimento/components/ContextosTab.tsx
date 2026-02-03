'use client'

import { useState, useEffect } from 'react'
import CRUDTable from '@/components/CRUDTable'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'

export default function ContextosTab() {
  const [contexts, setContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadContexts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge/contexts')
      const data = await res.json()
      setContexts(data.contexts || [])
    } catch (error) {
      console.error('Erro ao carregar contextos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContexts()
  }, [])

  const handleCreate = async (data: any) => {
    try {
      // Validação básica no frontend
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      // Processar tags
      let processedTags: string[] = []
      if (data.tags) {
        if (Array.isArray(data.tags)) {
          processedTags = data.tags.filter(Boolean)
        } else if (typeof data.tags === 'string') {
          processedTags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        }
      }

      const payload = {
        name: data.name.trim(),
        description: data.description || null,
        type: data.type || 'global',
        instructions: data.instructions || null,
        tone: data.tone || null,
        tags: processedTags.length > 0 ? processedTags : null,
        active: data.active !== undefined ? data.active : true,
      }

      console.log('📤 Enviando dados para API:', payload)

      const res = await fetch('/api/knowledge/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        const errorMessage = responseData.details 
          ? `${responseData.error || 'Erro ao criar contexto'}: ${responseData.details}`
          : responseData.error || 'Erro ao criar contexto'
        throw new Error(errorMessage)
      }

      console.log('✅ Contexto criado com sucesso')
      await loadContexts()
    } catch (error: any) {
      console.error('❌ Erro ao criar contexto:', error)
      throw error
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      // Processar tags
      let processedTags: string[] = []
      if (data.tags) {
        if (Array.isArray(data.tags)) {
          processedTags = data.tags
        } else if (typeof data.tags === 'string') {
          processedTags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        }
      }

      const res = await fetch(`/api/knowledge/contexts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: processedTags,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage = errorData.details 
          ? `${errorData.error || 'Erro ao atualizar contexto'}: ${errorData.details}`
          : errorData.error || 'Erro ao atualizar contexto'
        throw new Error(errorMessage)
      }

      await loadContexts()
    } catch (error: any) {
      console.error('Erro ao atualizar contexto:', error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/knowledge/contexts/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar contexto')
    }

    await loadContexts()
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descrição' },
    {
      key: 'documentCount',
      label: 'Documentos',
      render: (value: number) => value || 0,
    },
    {
      key: 'active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  const formFields = (data?: any, onChange?: (field: string, value: any) => void) => (
    <div className="space-y-4">
      <Input
        label="Nome"
        value={data?.name || ''}
        onChange={(e) => onChange?.('name', e.target.value)}
        required
      />
      <Select
        label="Tipo"
        value={data?.type || 'global'}
        onChange={(e) => onChange?.('type', e.target.value)}
        options={[
          { value: 'global', label: 'Global (Getter)' },
          { value: 'client', label: 'Cliente' },
          { value: 'project', label: 'Projeto' },
        ]}
      />
      <Textarea
        label="Descrição"
        value={data?.description || ''}
        onChange={(e) => onChange?.('description', e.target.value)}
        rows={3}
      />
      <Textarea
        label="Instruções do Contexto"
        value={data?.instructions || ''}
        onChange={(e) => onChange?.('instructions', e.target.value)}
        rows={4}
        placeholder="Instruções estilo system prompt para este contexto"
      />
      <Input
        label="Tom/Linguagem"
        value={data?.tone || ''}
        onChange={(e) => onChange?.('tone', e.target.value)}
        placeholder="Ex: Formal, Técnico, Conversacional"
      />
      <Input
        label="Tags (separadas por vírgula)"
        value={Array.isArray(data?.tags) ? data.tags.join(', ') : data?.tags || ''}
        onChange={(e) => onChange?.('tags', e.target.value)}
        placeholder="Ex: IA, Industrial, Safety"
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={data?.active !== false}
          onChange={(e) => onChange?.('active', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
          Ativo
        </label>
      </div>
    </div>
  )

  return (
    <CRUDTable
      title="Contextos de Conhecimento"
      columns={columns}
      data={contexts}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      formFields={formFields}
      loading={loading}
      modalSize="lg"
    />
  )
}
