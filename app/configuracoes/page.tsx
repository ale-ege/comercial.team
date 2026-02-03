'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import CRUDTable from '@/components/CRUDTable'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('closers')

  const tabs = [
    { id: 'closers', label: 'Closers' },
    { id: 'clients', label: 'Clientes' },
    { id: 'criteria', label: 'Critérios' },
    { id: 'prompt', label: 'Prompt Template' },
    { id: 'model', label: 'Model/Parâmetros' },
    { id: 'metas', label: 'Metas' },
    { id: 'readai', label: 'Read.ai Integration' },
  ]

  return (
    <SidebarLayout currentModule="configuracoes">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações</h1>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'closers' && <ClosersTab />}
            {activeTab === 'clients' && <ClientsTab />}
            {activeTab === 'criteria' && <CriteriaTab />}
            {activeTab === 'prompt' && <PromptTab />}
            {activeTab === 'model' && <ModelTab />}
            {activeTab === 'metas' && <MetasTab />}
            {activeTab === 'readai' && <ReadAiTab />}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

function ClosersTab() {
  const [closers, setClosers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadClosers = async () => {
    setLoading(true)
    const res = await fetch('/api/closers')
    const data = await res.json()
    setClosers(data.closers || [])
    setLoading(false)
  }

  useEffect(() => {
    loadClosers()
  }, [])

  const handleCreate = async (data: any) => {
    await fetch('/api/closers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadClosers()
  }

  const handleUpdate = async (id: string, data: any) => {
    await fetch(`/api/closers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadClosers()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/closers/${id}`, { method: 'DELETE' })
    loadClosers()
  }

  return (
    <CRUDTable
      title="Closers"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        {
          key: 'active',
          label: 'Status',
          render: (value) => (value ? 'Ativo' : 'Inativo'),
        },
      ]}
      data={closers}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={loading}
      formFields={(data, onChange) => (
        <>
          <Input
            label="Nome"
            value={data?.name || ''}
            onChange={(e) => onChange?.('name', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={data?.email || ''}
            onChange={(e) => onChange?.('email', e.target.value)}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data?.active !== false}
              onChange={(e) => onChange?.('active', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Ativo</label>
          </div>
        </>
      )}
    />
  )
}

function ClientsTab() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadClients = async () => {
    setLoading(true)
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
    setLoading(false)
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleCreate = async (data: any) => {
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadClients()
  }

  const handleUpdate = async (id: string, data: any) => {
    await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadClients()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    loadClients()
  }

  return (
    <CRUDTable
      title="Clientes"
      modalSize="lg"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'company', label: 'Empresa' },
        { key: 'phone', label: 'Telefone' },
        { key: 'leadName', label: 'Lead/Nome do Contato' },
        {
          key: 'active',
          label: 'Status',
          render: (value) => (value ? 'Ativo' : 'Inativo'),
        },
      ]}
      data={clients}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={loading}
      formFields={(data, onChange) => (
        <>
          <Input
            label="Nome"
            value={data?.name || ''}
            onChange={(e) => onChange?.('name', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={data?.email || ''}
            onChange={(e) => onChange?.('email', e.target.value)}
          />
          <Input
            label="Empresa"
            value={data?.company || ''}
            onChange={(e) => onChange?.('company', e.target.value)}
          />
          <Input
            label="Telefone"
            type="tel"
            value={data?.phone || ''}
            onChange={(e) => onChange?.('phone', e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <Input
            label="Lead/Nome do Contato"
            value={data?.leadName || ''}
            onChange={(e) => onChange?.('leadName', e.target.value)}
            placeholder="Nome do contato principal"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data?.active !== false}
              onChange={(e) => onChange?.('active', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Ativo</label>
          </div>
        </>
      )}
    />
  )
}

function CriteriaTab() {
  const [criteria, setCriteria] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadCriteria = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/criteria')
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Erro ao carregar critérios:', errorData)
        alert(`Erro ao carregar critérios: ${errorData.error || errorData.details || 'Erro desconhecido'}`)
        setLoading(false)
        return
      }
      
      const data = await res.json()
      setCriteria(data.criteria || [])
    } catch (error: any) {
      console.error('Erro ao carregar critérios:', error)
      alert(`Erro ao carregar critérios: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCriteria()
  }, [])

  const handleCreate = async (data: any) => {
    try {
      // Preparar dados para envio
      const payload = {
        name: data.name || '',
        description: data.description || '',
        weight: data.weight || 1.0,
        examples: data.examples 
          ? (Array.isArray(data.examples) 
              ? data.examples 
              : typeof data.examples === 'string' 
                ? data.examples.split('\n').filter((s: string) => s.trim())
                : [])
          : [],
        rules: data.rules 
          ? (Array.isArray(data.rules) 
              ? data.rules 
              : typeof data.rules === 'string' 
                ? data.rules.split('\n').filter((s: string) => s.trim())
                : [])
          : [],
        goodExamples: data.goodExamples || null,
        badExamples: data.badExamples || null,
        active: data.active !== false,
      }
      
      console.log('Criando critério com payload:', payload)
      
      const res = await fetch('/api/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Erro na resposta:', errorData)
        alert(`Erro ao criar critério: ${errorData.error || errorData.details || 'Erro desconhecido'}`)
        return
      }
      
      const result = await res.json()
      console.log('Critério criado com sucesso:', result)
      
      await loadCriteria()
    } catch (error: any) {
      console.error('Erro ao criar critério:', error)
      alert(`Erro ao criar critério: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/criteria/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          examples: data.examples ? (Array.isArray(data.examples) ? data.examples : data.examples.split('\n').filter((s: string) => s.trim())) : [],
          rules: data.rules ? (Array.isArray(data.rules) ? data.rules : data.rules.split('\n').filter((s: string) => s.trim())) : [],
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        alert(`Erro ao atualizar critério: ${errorData.error || errorData.details || 'Erro desconhecido'}`)
        return
      }
      
      await loadCriteria()
    } catch (error: any) {
      console.error('Erro ao atualizar critério:', error)
      alert(`Erro ao atualizar critério: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/criteria/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const errorData = await res.json()
        alert(`Erro ao deletar critério: ${errorData.error || errorData.details || 'Erro desconhecido'}`)
        return
      }
      
      await loadCriteria()
    } catch (error: any) {
      console.error('Erro ao deletar critério:', error)
      alert(`Erro ao deletar critério: ${error.message || 'Erro desconhecido'}`)
    }
  }

  return (
    <CRUDTable
      title="Critérios"
      modalSize="xl"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'weight', label: 'Peso' },
        {
          key: 'active',
          label: 'Status',
          render: (value) => (value ? 'Ativo' : 'Inativo'),
        },
      ]}
      data={criteria}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={loading}
      formFields={(data, onChange) => (
        <>
          <Input
            label="Nome"
            value={data?.name || ''}
            onChange={(e) => onChange?.('name', e.target.value)}
          />
          <Textarea
            label="Descrição"
            rows={3}
            value={data?.description || ''}
            onChange={(e) => onChange?.('description', e.target.value)}
          />
          <Input
            label="Peso"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={data?.weight || 1}
            onChange={(e) => onChange?.('weight', parseFloat(e.target.value))}
          />
          <Textarea
            label="Exemplos (um por linha)"
            rows={3}
            value={data?.examples?.join?.('\n') || data?.examples || ''}
            onChange={(e) => onChange?.('examples', e.target.value)}
          />
          <Textarea
            label="Regras (um por linha)"
            rows={3}
            value={data?.rules?.join?.('\n') || data?.rules || ''}
            onChange={(e) => onChange?.('rules', e.target.value)}
          />
          <Textarea
            label="Exemplos do que é bom"
            rows={2}
            value={data?.goodExamples || ''}
            onChange={(e) => onChange?.('goodExamples', e.target.value)}
          />
          <Textarea
            label="Exemplos do que é ruim"
            rows={2}
            value={data?.badExamples || ''}
            onChange={(e) => onChange?.('badExamples', e.target.value)}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data?.active !== false}
              onChange={(e) => onChange?.('active', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Ativo</label>
          </div>
        </>
      )}
    />
  )
}

function PromptTab() {
  const [templates, setTemplates] = useState<any[]>([])
  const [activeTemplate, setActiveTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    setLoading(true)
    const res = await fetch('/api/prompt-templates')
    const data = await res.json()
    setTemplates(data.templates || [])
    const active = data.templates?.find((t: any) => t.active)
    setActiveTemplate(active || null)
    setLoading(false)
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleSave = async () => {
    if (!activeTemplate) return

    await fetch(`/api/prompt-templates/${activeTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: activeTemplate.content,
        name: activeTemplate.name,
      }),
    })

    // Criar nova versão
    await fetch('/api/prompt-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: activeTemplate.name,
        content: activeTemplate.content,
        active: true,
      }),
    })

    loadTemplates()
    alert('Template salvo com sucesso!')
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <div className="mb-4">
        <Select
          label="Template"
          value={activeTemplate?.id || ''}
          onChange={(e) => {
            const template = templates.find((t) => t.id === e.target.value)
            setActiveTemplate(template || null)
          }}
          options={templates.map((t) => ({
            value: t.id,
            label: `${t.name} (v${t.version})${t.active ? ' - Ativo' : ''}`,
          }))}
        />
      </div>

      {activeTemplate && (
        <>
          <div className="mb-4">
            <Textarea
              label="Conteúdo do Prompt"
              rows={20}
              value={activeTemplate.content || ''}
              onChange={(e) =>
                setActiveTemplate({ ...activeTemplate, content: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{{CRITERIA_LIST}}'}, {'{{TRANSCRIPT}}'}, {'{{CLIENT_NAME}}'} e{' '}
              {'{{CLOSER_NAME}}'} como placeholders
            </p>
          </div>
          <Button onClick={handleSave}>Salvar Nova Versão</Button>
        </>
      )}
    </div>
  )
}

function ModelTab() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    setLoading(true)
    const res = await fetch('/api/model-config')
    const data = await res.json()
    setConfig(data.config || null)
    setLoading(false)
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return

    if (config.id) {
      await fetch(`/api/model-config/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
    } else {
      await fetch('/api/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, active: true }),
      })
    }

    loadConfig()
    alert('Configuração salva com sucesso!')
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  const isGPT5 = config?.model?.startsWith('gpt-5')
  const reasoningEffort = config?.reasoningEffort || 'none'

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Model
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={config?.model || 'gpt-5.2'}
          onChange={(e) => setConfig({ ...config, model: e.target.value })}
        >
          <option value="gpt-5.2">gpt-5.2 (Recomendado - Mais recente e inteligente)</option>
          <option value="gpt-5.2-pro">gpt-5.2-pro (Pensamento mais profundo)</option>
          <option value="gpt-5.2-codex">gpt-5.2-codex (Otimizado para código)</option>
          <option value="gpt-5-mini">gpt-5-mini (Mais barato)</option>
          <option value="gpt-5-nano">gpt-5-nano (Alto throughput)</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4-turbo">gpt-4-turbo</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          GPT-5.2 é o modelo mais recente e recomendado. Modelos o1 não suportam JSON mode.
        </p>
      </div>

      {isGPT5 && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Reasoning Effort
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={reasoningEffort}
              onChange={(e) => setConfig({ ...config, reasoningEffort: e.target.value })}
            >
              <option value="none">none (Padrão - Mais rápido, menor latência)</option>
              <option value="low">low (Raciocínio leve)</option>
              <option value="medium">medium (Raciocínio moderado)</option>
              <option value="high">high (Raciocínio profundo)</option>
              <option value="xhigh">xhigh (Máximo raciocínio - GPT-5.2)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Controla quantos tokens de raciocínio o modelo gera antes da resposta.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Verbosity
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={config?.verbosity || 'medium'}
              onChange={(e) => setConfig({ ...config, verbosity: e.target.value })}
            >
              <option value="low">low (Respostas concisas)</option>
              <option value="medium">medium (Padrão - Balanceado)</option>
              <option value="high">high (Explicações detalhadas)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Controla o número de tokens de saída gerados.
            </p>
          </div>
        </>
      )}

      {(!isGPT5 || reasoningEffort === 'none') && (
        <>
          <Input
            label="Temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={config?.temperature || 0.7}
            onChange={(e) =>
              setConfig({ ...config, temperature: parseFloat(e.target.value) })
            }
            disabled={isGPT5 && reasoningEffort !== 'none'}
          />
          {isGPT5 && reasoningEffort !== 'none' && (
            <p className="text-xs text-gray-500 -mt-2">
              Temperature só está disponível quando reasoning_effort = none
            </p>
          )}
          <Input
            label="Top P"
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={config?.topP || 1.0}
            onChange={(e) =>
              setConfig({ ...config, topP: parseFloat(e.target.value) })
            }
            disabled={isGPT5 && reasoningEffort !== 'none'}
          />
          {isGPT5 && reasoningEffort !== 'none' && (
            <p className="text-xs text-gray-500 -mt-2">
              Top P só está disponível quando reasoning_effort = none
            </p>
          )}
        </>
      )}

      <Input
        label="Max Tokens"
        type="number"
        min="1"
        max={isGPT5 ? "16000" : "4000"}
        value={config?.maxTokens || (isGPT5 ? 8000 : 2000)}
        onChange={(e) =>
          setConfig({ ...config, maxTokens: parseInt(e.target.value) })
        }
      />
      {isGPT5 && (
        <p className="text-xs text-gray-500 -mt-2">
          Para GPT-5.2, este valor inclui reasoning_tokens + completion_tokens. Recomendado: 8000-10000 para análises complexas.
        </p>
      )}
      <Button onClick={handleSave}>Salvar Configuração</Button>
    </div>
  )
}

const DEFAULT_METAS = {
  metaReunioesSemanaGeral: 21,
  metaReunioesSemanaPorCloser: 5,
  metaNotaCloser: 70,
  metaVendas: 0,
  metaLeadPorSemana: 60,
  metaGeracaoOportunidade: 75,
  metaEnvioProposta: 50,
  metaConversao: 15,
}

function MetasTab() {
  const [metas, setMetas] = useState(DEFAULT_METAS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/metas')
      .then((res) => res.json())
      .then((data) => {
        if (data.metas) setMetas({ ...DEFAULT_METAS, ...data.metas })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/metas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metas),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const data = await res.json()
      if (data.metas) setMetas({ ...DEFAULT_METAS, ...data.metas })
      alert('Metas salvas com sucesso!')
    } catch {
      alert('Erro ao salvar metas')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-amber-900 mb-1">Metas do Dashboard</h3>
        <p className="text-sm text-amber-800">
          Configure as metas exibidas nos gráficos e KPIs. As alterações aparecem imediatamente no Dashboard.
        </p>
      </div>
      <div className="space-y-4">
        <Input
          label="Meta: Vendas (soma Fechado)"
          type="number"
          min={0}
          value={String(metas.metaVendas ?? 0)}
          onChange={(e) => setMetas({ ...metas, metaVendas: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Meta numérica para o KPI Vendas (soma dos status Fechado). 0 = não exibir meta.
        </p>
        <Input
          label="Meta: Lead por semana"
          type="number"
          min={0}
          value={String(metas.metaLeadPorSemana ?? 60)}
          onChange={(e) => setMetas({ ...metas, metaLeadPorSemana: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Linha de meta no gráfico &quot;Quantidade de reuniões por semana&quot; (quando nenhum closer filtrado).
        </p>
        <Input
          label="Meta: Reuniões por semana (1 closer)"
          type="number"
          min={0}
          value={String(metas.metaReunioesSemanaPorCloser ?? 5)}
          onChange={(e) => setMetas({ ...metas, metaReunioesSemanaPorCloser: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Linha de meta no mesmo gráfico quando um único closer está selecionado.
        </p>
        <Input
          label="Meta: Geração de oportunidade (%)"
          type="number"
          min={0}
          max={100}
          value={String(metas.metaGeracaoOportunidade ?? 75)}
          onChange={(e) => setMetas({ ...metas, metaGeracaoOportunidade: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Meta em % (Oportunidades geradas / Total de lead).
        </p>
        <Input
          label="Meta: Envio de proposta (%)"
          type="number"
          min={0}
          max={100}
          value={String(metas.metaEnvioProposta ?? 50)}
          onChange={(e) => setMetas({ ...metas, metaEnvioProposta: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Meta em % (Proposta apresentada + Negociação / Total de lead).
        </p>
        <Input
          label="Meta: Conversão (%)"
          type="number"
          min={0}
          max={100}
          value={String(metas.metaConversao ?? 15)}
          onChange={(e) => setMetas({ ...metas, metaConversao: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Meta em % (Fechado / Total de lead).
        </p>
        <Input
          label="Meta: Nota (gráfico Closer)"
          type="number"
          min={0}
          max={100}
          value={String(metas.metaNotaCloser ?? 70)}
          onChange={(e) => setMetas({ ...metas, metaNotaCloser: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Linha de meta no gráfico &quot;Nota média por Closer (últimas 52 semanas)&quot;.
        </p>
        <Input
          label="Meta: Reuniões por semana (geral)"
          type="number"
          min={0}
          value={String(metas.metaReunioesSemanaGeral ?? 21)}
          onChange={(e) => setMetas({ ...metas, metaReunioesSemanaGeral: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Alternativa à meta lead/semana no gráfico (legado).
        </p>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Metas'}
      </Button>
    </div>
  )
}

function ReadAiTab() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importHistory, setImportHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadConfig()
    loadHistory()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/readai/config')
      const data = await res.json()
      setConfig(data.config)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/integrations/readai/history?limit=20')
      const data = await res.json()
      setImportHistory(data.imports || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/integrations/readai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar configuração')
      }

      const data = await res.json()
      setConfig(data.config)
      alert('Configuração salva com sucesso!')
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async (importAll: boolean) => {
    if (!confirm(`Tem certeza que deseja ${importAll ? 'importar todas as reuniões' : 'importar apenas as novas'}?`)) {
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/integrations/readai/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importAll, limit: importAll ? undefined : 50 }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao importar')
      }

      const data = await res.json()
      const imported = data.results?.imported ?? 0
      if (imported > 0) {
        alert(`Importação iniciada! ${imported} reuniões em processamento.`)
      } else {
        alert(
          'Nenhuma reunião encontrada para importar.\n\n' +
          'A importação manual ainda não busca reuniões diretamente da API do Read.ai. ' +
          'Para receber transcrições automaticamente, configure o webhook no painel do Read.ai usando a URL exibida acima (Analytics → Integrations → Webhooks). ' +
          'Quando uma reunião for processada pelo Read.ai, a transcrição será enviada para esta URL.'
        )
      }
      await loadConfig()
      await loadHistory()
    } catch (error: any) {
      alert(error.message || 'Erro ao importar')
    } finally {
      setImporting(false)
    }
  }

  const copyWebhookUrl = () => {
    if (config?.webhookUrl) {
      navigator.clipboard.writeText(config.webhookUrl)
      alert('URL do webhook copiada para a área de transferência!')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!config) {
    return <div className="text-center py-8 text-red-600">Erro ao carregar configuração</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Integração Read.ai</h3>
        <p className="text-sm text-blue-800">
          Configure a integração com Read.ai para importar automaticamente transcrições de reuniões.
          Configure o webhook no painel do Read.ai usando a URL abaixo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={config.enabled || false}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm font-medium text-gray-900">
            Habilitar integração
          </label>
        </div>

        {config.enabled && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Webhook
              </label>
              <div className="flex gap-2">
                <Input
                  value={config.webhookUrl || 'Gerando...'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="secondary" onClick={copyWebhookUrl}>
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Configure esta URL no painel do Read.ai em Analytics → Integrations → Webhooks
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoImport"
                checked={config.autoImport || false}
                onChange={(e) => setConfig({ ...config, autoImport: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoImport" className="ml-2 block text-sm font-medium text-gray-900">
                Importação automática via webhook
              </label>
            </div>

            {config.autoImport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Sincronização (Cron Expression)
                </label>
                <Input
                  value={config.importSchedule || ''}
                  onChange={(e) => setConfig({ ...config, importSchedule: e.target.value })}
                  placeholder="Ex: 0 9 * * * (diariamente às 9h)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato Cron: minuto hora dia mês dia-da-semana. Ex: "0 9 * * *" = diariamente às 9h
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="importAllOnFirstSync"
                checked={config.importAllOnFirstSync !== false}
                onChange={(e) => setConfig({ ...config, importAllOnFirstSync: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="importAllOnFirstSync" className="ml-2 block text-sm font-medium text-gray-900">
                Importar todas as reuniões na primeira sincronização
              </label>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Importação Manual</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleImport(false)}
                  disabled={importing || !config.enabled}
                >
                  {importing ? 'Importando...' : 'Importar Novas Reuniões'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleImport(true)}
                  disabled={importing || !config.enabled}
                >
                  Importar Todas
                </Button>
              </div>
            </div>

            {config.lastSyncAt && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Última Sincronização</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(config.lastSyncAt).toLocaleString('pt-BR')}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs ${
                      config.lastSyncStatus === 'success'
                        ? 'bg-green-100 text-green-800'
                        : config.lastSyncStatus === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {config.lastSyncStatus || 'N/A'}
                    </span>
                  </p>
                  {config.lastSyncError && (
                    <p className="text-red-600">
                      <span className="font-medium">Erro:</span> {config.lastSyncError}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-gray-900">Histórico de Importações</h4>
                <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
              {showHistory && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ID Read.ai
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                            Nenhuma importação encontrada
                          </td>
                        </tr>
                      ) : (
                        importHistory.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {item.readAiMeetingId}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                item.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  )
}