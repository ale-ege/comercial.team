'use client'

import { useState, useRef, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [clientName, setClientName] = useState('')
  const [closerId, setCloserId] = useState('')
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [closers, setClosers] = useState<{ id: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Carregar closers ao montar
  useEffect(() => {
    fetch('/api/closers')
      .then((res) => res.json())
      .then((data) => {
        if (data.closers) {
          setClosers(data.closers)
        }
      })
      .catch(console.error)
  }, [])


  const handleProcess = async () => {
    if (!clientName || !closerId || !transcript) {
      setError('Preencha todos os campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Primeiro, criar ou buscar cliente
      let clientId: string
      const clientsRes = await fetch('/api/clients')
      
      if (!clientsRes.ok) {
        throw new Error('Erro ao buscar clientes')
      }
      
      const clientsData = await clientsRes.json()
      const existingClient = clientsData.clients?.find(
        (c: any) => c.name.toLowerCase() === clientName.toLowerCase()
      )

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const createRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: clientName, active: true }),
        })
        
        if (!createRes.ok) {
          const errorText = await createRes.text()
          throw new Error(`Erro ao criar cliente: ${errorText.substring(0, 200)}`)
        }
        
        const createData = await createRes.json()
        clientId = createData.client.id
      }

      // Processar transcrição
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          closerId,
          transcript,
          fileName: fileName || null,
        }),
      })

      // Verificar se a resposta é JSON
      const contentType = analyzeRes.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await analyzeRes.text()
        throw new Error(`Erro do servidor: ${analyzeRes.status} ${analyzeRes.statusText}. Resposta: ${text.substring(0, 200)}`)
      }

      const data = await analyzeRes.json()

      if (!analyzeRes.ok) {
        const errorMsg = data.error || data.details || 'Erro ao processar'
        const hint = data.hint ? `\n\nDica: ${data.hint}` : ''
        throw new Error(`${errorMsg}${hint}`)
      }
      // Redirecionar para página de resultado
      router.push(`/relatorio/${data.report.id}`)
    } catch (err: any) {
      console.error('Erro no frontend:', err)
      // Mostrar mensagem de erro mais detalhada
      let errorMessage = err.message || 'Erro ao processar transcrição'
      
      // Se for um erro de rede, mostrar mensagem mais amigável
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando e tente novamente.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const [fileName, setFileName] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/plain') {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        setTranscript(event.target?.result as string)
      }
      reader.readAsText(file)
    } else {
      setError('Por favor, selecione um arquivo .txt')
    }
  }

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Análise de Transcrição
        </h1>

        <div className="bg-white shadow rounded-lg p-6 max-w-6xl w-full">
          <div className="space-y-4">
            <Input
              label="Nome do Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite o nome do cliente"
            />

            <Select
              label="Closer"
              value={closerId}
              onChange={(e) => setCloserId(e.target.value)}
              options={closers.map((c) => ({ value: c.id, label: c.name }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcrição
              </label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ou cole a transcrição abaixo
              </p>
            </div>

            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={10}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole a transcrição aqui ou carregue um arquivo .txt"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-line">
                <strong>Erro:</strong> {error}
              </div>
            )}

            <Button onClick={handleProcess} loading={loading} className="w-full">
              Processar
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}