'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'

export default function BuscaTab() {
  const [contexts, setContexts] = useState<any[]>([])
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [scoreThreshold, setScoreThreshold] = useState(0.7)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [contextPack, setContextPack] = useState<string>('')
  const [generatingPack, setGeneratingPack] = useState(false)

  const loadContexts = async () => {
    try {
      const res = await fetch('/api/knowledge/contexts?active=true')
      const data = await res.json()
      setContexts(data.contexts || [])
    } catch (error) {
      console.error('Erro ao carregar contextos:', error)
    }
  }

  useEffect(() => {
    loadContexts()
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Digite uma query de busca')
      return
    }

    setSearching(true)
    setResults(null)

    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contextIds: selectedContextIds,
          topK,
          scoreThreshold,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao buscar')
      }

      const data = await res.json()
      setResults(data)
    } catch (error: any) {
      alert(error.message || 'Erro ao buscar')
    } finally {
      setSearching(false)
    }
  }

  const handleGeneratePack = async () => {
    if (selectedContextIds.length === 0) {
      alert('Selecione pelo menos um contexto')
      return
    }

    setGeneratingPack(true)
    setContextPack('')

    try {
      const res = await fetch('/api/knowledge/context-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextIds: selectedContextIds,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao gerar pack')
      }

      const data = await res.json()
      setContextPack(data.contextPack)
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar pack')
    } finally {
      setGeneratingPack(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Busca e Teste (Playground)</h2>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contextos Ativos (selecione para filtrar)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {contexts.map((ctx) => (
                <label key={ctx.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedContextIds.includes(ctx.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContextIds([...selectedContextIds, ctx.id])
                      } else {
                        setSelectedContextIds(selectedContextIds.filter((id) => id !== ctx.id))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {ctx.name} ({ctx.type}) - {ctx.documentCount} docs
                  </span>
                </label>
              ))}
            </div>
            {selectedContextIds.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Nenhum contexto selecionado = busca em todos</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query de Busca
            </label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua pergunta ou termo de busca..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSearch()
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top K (resultados)
              </label>
              <Input
                type="number"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                min={1}
                max={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Threshold (0-1)
              </label>
              <Input
                type="number"
                step="0.1"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(parseFloat(e.target.value) || 0.7)}
                min={0}
                max={1}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      {results && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resultados ({results.resultsCount} de {results.totalChunks} chunks)
          </h3>
          <div className="space-y-4">
            {results.results.map((result: any, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{result.document.title}</h4>
                    <p className="text-sm text-gray-500">
                      {result.document.source && `${result.document.source} • `}
                      Score: {(result.score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Chunk {result.chunkIndex}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{result.content}</p>
                {result.metadata.page && (
                  <p className="text-xs text-gray-500 mt-1">Página {result.metadata.page}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerar Pack de Contexto</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <p className="text-sm text-gray-600">
            Gera um texto consolidado com instruções e conteúdo dos contextos selecionados,
            pronto para ser usado em prompts da API.
          </p>
          <Button onClick={handleGeneratePack} disabled={generatingPack || selectedContextIds.length === 0}>
            {generatingPack ? 'Gerando...' : 'Gerar Pack de Contexto'}
          </Button>

          {contextPack && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pack de Contexto Gerado
              </label>
              <Textarea
                value={contextPack}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(contextPack)
                  alert('Pack copiado para a área de transferência!')
                }}
                className="mt-2"
              >
                Copiar para Área de Transferência
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
