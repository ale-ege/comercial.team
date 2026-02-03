'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'

export default function DocumentosTab() {
  const [documents, setDocuments] = useState<any[]>([])
  const [contexts, setContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<any>({
    title: '',
    source: '',
    content: '',
    fileType: '',
    language: 'pt-BR',
    tags: '',
    contextIds: [],
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadContexts = async () => {
    try {
      const res = await fetch('/api/knowledge/contexts')
      const data = await res.json()
      setContexts(data.contexts || [])
    } catch (error) {
      console.error('Erro ao carregar contextos:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
    loadContexts()
  }, [])

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      if (formData.source) formDataToSend.append('source', formData.source)
      if (formData.content) formDataToSend.append('content', formData.content)
      if (formData.fileType) formDataToSend.append('fileType', formData.fileType)
      formDataToSend.append('language', formData.language)
      if (formData.tags) {
        const tags = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        formDataToSend.append('tags', JSON.stringify(tags))
      }
      if (formData.contextIds.length > 0) {
        formDataToSend.append('contextIds', JSON.stringify(formData.contextIds))
      }
      if (selectedFile) {
        formDataToSend.append('file', selectedFile)
      }

      const res = await fetch('/api/knowledge/documents', {
        method: 'POST',
        body: formDataToSend,
      })

      const responseData = await res.json()

      if (!res.ok) {
        const errorMessage = responseData.details 
          ? `${responseData.error || 'Erro ao criar documento'}\n\n${responseData.details}`
          : responseData.error || 'Erro ao criar documento'
        
        console.error('❌ Erro ao criar documento:', responseData)
        alert(errorMessage)
        return // Não relançar o erro, apenas mostrar o alert
      }

      setIsModalOpen(false)
      setFormData({
        title: '',
        source: '',
        content: '',
        fileType: '',
        language: 'pt-BR',
        tags: '',
        contextIds: [],
      })
      setSelectedFile(null)
      await loadDocuments()
    } catch (error: any) {
      console.error('❌ Erro inesperado ao criar documento:', error)
      const errorMessage = error.message || error.details || 'Erro ao criar documento'
      alert(`Erro: ${errorMessage}`)
      // Não relançar o erro para evitar erro não tratado
    }
  }

  const handleReprocess = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja reprocessar este documento?')) return

    try {
      const res = await fetch(`/api/knowledge/documents/${documentId}/reprocess`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao reprocessar documento')
      }

      await loadDocuments()
    } catch (error: any) {
      alert(error.message || 'Erro ao reprocessar documento')
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const res = await fetch(`/api/knowledge/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao deletar documento')
      }

      await loadDocuments()
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar documento')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processando' },
      indexed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Indexado' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Erro' },
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Documentos</h2>
        <Button onClick={() => setIsModalOpen(true)}>Adicionar Documento</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum documento cadastrado</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chunks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contextos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.fileType || 'Texto'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(doc.status)}
                    {doc.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">{doc.errorMessage}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.chunkCount || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.contextIds?.length || 0} contexto(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {doc.status === 'error' && (
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Reprocessar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Documento"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Fonte"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="Ex: Site oficial, Manual técnico"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload de Arquivo (PDF, DOCX, TXT, MD)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setSelectedFile(file || null)
                if (file) {
                  const ext = file.name.split('.').pop()?.toLowerCase()
                  setFormData({ ...formData, fileType: ext || '' })
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="text-sm text-gray-500">OU</div>
          <Textarea
            label="Colar Texto"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            placeholder="Cole o conteúdo do documento aqui..."
          />
          <Select
            label="Idioma"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            options={[
              { value: 'pt-BR', label: 'Português (BR)' },
              { value: 'en', label: 'Inglês' },
              { value: 'es', label: 'Espanhol' },
            ]}
          />
          <Input
            label="Tags (separadas por vírgula)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ex: IA, Industrial, Safety"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contextos
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {contexts.map((ctx) => (
                <label key={ctx.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.contextIds.includes(ctx.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          contextIds: [...formData.contextIds, ctx.id],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          contextIds: formData.contextIds.filter((id: string) => id !== ctx.id),
                        })
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {ctx.name} ({ctx.type})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
