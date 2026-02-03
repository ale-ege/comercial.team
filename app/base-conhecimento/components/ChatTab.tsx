'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    documentTitle: string
    documentSource: string | null
    contexts: string[]
    score: number
  }>
  timestamp: Date
}

export default function ChatTab() {
  const [contexts, setContexts] = useState<any[]>([])
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [topK, setTopK] = useState(5)
  const [scoreThreshold, setScoreThreshold] = useState(0.6)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    // Scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!question.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/knowledge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          contextIds: selectedContextIds,
          topK,
          scoreThreshold,
          conversationHistory,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao processar pergunta')
      }

      const data = await res.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Erro ao enviar pergunta:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Erro: ${error.message || 'Não foi possível processar sua pergunta.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (confirm('Limpar histórico da conversa?')) {
      setMessages([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat com Base de Conhecimento</h2>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contextos Ativos (selecione para filtrar)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
              {contexts.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum contexto disponível</p>
              ) : (
                contexts.map((ctx) => (
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
                      {ctx.name} ({ctx.type}) - {ctx.documentCount || 0} docs
                    </span>
                  </label>
                ))
              )}
            </div>
            {selectedContextIds.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Nenhum contexto selecionado = busca em todos</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top K (chunks)
              </label>
              <Input
                type="number"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Threshold (0-1)
              </label>
              <Input
                type="number"
                step="0.1"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(parseFloat(e.target.value) || 0.6)}
                min={0}
                max={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">💬 Faça sua primeira pergunta!</p>
            <p className="text-sm">O assistente responderá baseado no conhecimento indexado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs font-semibold mb-1">Fontes:</p>
                      <div className="space-y-1">
                        {message.sources.map((source, sIdx) => (
                          <div key={sIdx} className="text-xs opacity-80">
                            • {source.documentTitle}
                            {source.documentSource && ` (${source.documentSource})`}
                            {source.contexts.length > 0 && ` - ${source.contexts.join(', ')}`}
                            <span className="ml-1">({(source.score * 100).toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm text-gray-600">Processando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Área de input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua pergunta aqui... (Enter para enviar, Shift+Enter para nova linha)"
            rows={3}
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleSend} disabled={loading || !question.trim()}>
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
          {messages.length > 0 && (
            <Button variant="secondary" onClick={handleClear} disabled={loading}>
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
