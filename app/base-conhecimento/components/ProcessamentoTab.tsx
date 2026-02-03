'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import Select from '@/components/Select'

export default function ProcessamentoTab() {
  const [allDocuments, setAllDocuments] = useState<any[]>([])
  const [contexts, setContexts] = useState<any[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [selectedContextId, setSelectedContextId] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/knowledge/documents?status=pending')
      const data = await res.json()
      setAllDocuments(data.documents || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    }
  }

  // Filtrar documentos baseado no contexto selecionado
  const getFilteredDocuments = () => {
    if (!selectedContextId) {
      return allDocuments
    }
    
    // Filtrar documentos que pertencem ao contexto selecionado
    return allDocuments.filter((doc) => 
      doc.contextIds && doc.contextIds.includes(selectedContextId)
    )
  }

  const documents = getFilteredDocuments()

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

  const handleIndex = async () => {
    if (!selectedDocumentId && !selectedContextId) {
      alert('Selecione um documento ou contexto para processar')
      return
    }

    setProcessing(true)
    setResults([])

    try {
      const body: any = {}
      if (selectedDocumentId) body.documentId = selectedDocumentId
      if (selectedContextId) body.contextId = selectedContextId

      const res = await fetch('/api/knowledge/index/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao processar')
      }

      const data = await res.json()
      
      if (data.results) {
        setResults(data.results)
      } else {
        setResults([data])
      }

      await loadDocuments()
    } catch (error: any) {
      alert(error.message || 'Erro ao processar')
    } finally {
      setProcessing(false)
    }
  }

  const handleIndexAll = async () => {
    if (!confirm('Processar todos os documentos pendentes?')) return

    setProcessing(true)
    setResults([])

    try {
      const res = await fetch('/api/knowledge/index/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao processar')
      }

      const data = await res.json()
      setResults(data.results || [])

      await loadDocuments()
    } catch (error: any) {
      alert(error.message || 'Erro ao processar')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Processamento e Indexação</h2>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processar Documento Específico
            </label>
            <Select
              value={selectedDocumentId}
              onChange={(e) => {
                setSelectedDocumentId(e.target.value)
                // Não limpar o contexto selecionado, permitir ambos
              }}
              options={[
                { value: '', label: selectedContextId ? 'Selecione um documento do contexto...' : 'Selecione um documento...' },
                ...documents.map((doc) => ({
                  value: doc.id,
                  label: `${doc.title} (${doc.status})`,
                })),
              ]}
              disabled={selectedContextId && documents.length === 0}
            />
            {selectedContextId && documents.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Nenhum documento pendente encontrado para este contexto.
              </p>
            )}
          </div>

          <div className="text-center text-gray-500">OU</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processar Todos os Documentos de um Contexto
            </label>
            <Select
              value={selectedContextId}
              onChange={(e) => {
                const newContextId = e.target.value
                setSelectedContextId(newContextId)
                // Se mudou o contexto e havia um documento selecionado, verificar se ainda é válido
                if (newContextId && selectedDocumentId) {
                  const filteredDocs = allDocuments.filter((doc) => 
                    doc.contextIds && doc.contextIds.includes(newContextId)
                  )
                  const isDocumentStillValid = filteredDocs.some((doc) => doc.id === selectedDocumentId)
                  if (!isDocumentStillValid) {
                    // Documento não pertence ao novo contexto, limpar seleção
                    setSelectedDocumentId('')
                  }
                }
              }}
              options={[
                { value: '', label: 'Selecione um contexto...' },
                ...contexts.map((ctx) => ({
                  value: ctx.id,
                  label: `${ctx.name} (${ctx.documentCount} docs)`,
                })),
              ]}
            />
            {selectedContextId && (
              <p className="text-xs text-gray-500 mt-1">
                Filtrando documentos do contexto selecionado. Você pode selecionar um documento específico ou processar todos.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleIndex} 
              disabled={processing || (!selectedDocumentId && !selectedContextId)}
            >
              {processing ? 'Processando...' : 'Indexar Agora'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleIndexAll} 
              disabled={processing}
            >
              Processar Todos Pendentes
            </Button>
          </div>
          {selectedDocumentId && selectedContextId && (
            <p className="text-xs text-yellow-600 mt-2">
              ⚠️ Ambos documento e contexto selecionados. O documento específico será processado.
            </p>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados do Processamento</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chunks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm text-gray-900">{result.documentId}</td>
                    <td className="px-6 py-4 text-sm">
                      {result.success ? (
                        <span className="text-green-600">✓ Sucesso</span>
                      ) : (
                        <span className="text-red-600">✗ Erro: {result.error}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.chunksCreated || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.tokensUsed || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(2)}s` : '-'}
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
