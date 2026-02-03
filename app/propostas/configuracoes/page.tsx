'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import CRUDTable from '@/components/CRUDTable'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import { PROPOSAL_STEPS } from '@/lib/proposal'

export default function PropostasConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('model')

  const tabs = [
    { id: 'model', label: 'Model/Parâmetros' },
    { id: 'templates', label: 'Templates de Proposta' },
  ]

  return (
    <SidebarLayout currentModule="criador-proposta">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações - Criador de Proposta</h1>

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
            {activeTab === 'model' && <ModelTab />}
            {activeTab === 'templates' && <ProposalTemplatesTab />}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

function ModelTab() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/model-config')
      const data = await res.json()
      setConfig(data.config || null)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      alert('Erro ao carregar configuração do modelo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return

    try {
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
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      alert('Erro ao salvar configuração')
    }
  }

  if (loading) {
    return <div className="text-gray-600">Carregando...</div>
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

      {reasoningEffort === 'none' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Temperature
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={config?.temperature || 0.7}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Controla a aleatoriedade (0 = determinístico, 2 = muito criativo). Disponível apenas quando Reasoning Effort = none.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Top P
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config?.topP || 1.0}
              onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Controla a diversidade (0.1 = focado, 1.0 = diverso). Disponível apenas quando Reasoning Effort = none.
            </p>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Max Tokens
        </label>
        <Input
          type="number"
          min="1000"
          max="16000"
          value={config?.maxTokens || 8000}
          onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
        />
        <p className="mt-1 text-xs text-gray-500">
          Número máximo de tokens na resposta. Para GPT-5, use max_completion_tokens.
        </p>
      </div>

      <Button onClick={handleSave}>Salvar Configuração</Button>
    </div>
  )
}

function ProposalTemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/prompt-templates')
      const data = await res.json()
      // Filtrar apenas templates de proposta
      const proposalTemplates = (data.templates || []).filter(
        (t: any) => t.category === 'proposal' && t.stepKey
      )
      // Ordenar por stepNumber
      proposalTemplates.sort((a: any, b: any) => {
        const stepA = PROPOSAL_STEPS.find(s => s.key === a.stepKey)
        const stepB = PROPOSAL_STEPS.find(s => s.key === b.stepKey)
        return (stepA?.number || 0) - (stepB?.number || 0)
      })
      setTemplates(proposalTemplates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      alert('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleCreate = async (data: any) => {
    try {
      const step = PROPOSAL_STEPS.find(s => s.number === parseInt(data.stepNumber))
      if (!step) {
        alert('Step number inválido')
        return
      }

      // Desativar outros templates do mesmo stepKey
      await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || `Proposta - ${step.title}`,
          content: data.content || '',
          category: 'proposal',
          stepKey: step.key,
          active: data.active || false,
        }),
      })

      await loadTemplates()
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(`Erro ao criar template: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const template = templates.find(t => t.id === id)
      if (!template) return

      // Se ativando, desativar outros do mesmo stepKey
      if (data.active && !template.active) {
        const sameStepTemplates = templates.filter(
          (t: any) => t.stepKey === template.stepKey && t.active && t.id !== id
        )
        for (const t of sameStepTemplates) {
          await fetch(`/api/prompt-templates/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: false }),
          })
        }
      }

      await fetch(`/api/prompt-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          content: data.content,
          active: data.active,
        }),
      })

      // Criar nova versão se necessário
      if (data.createNewVersion) {
        await fetch('/api/prompt-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            content: data.content,
            category: 'proposal',
            stepKey: template.stepKey,
            active: data.active,
          }),
        })
      }

      await loadTemplates()
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error)
      alert(`Erro ao atualizar template: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/prompt-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        alert(`Erro ao deletar template: ${errorData.error || errorData.details || 'Erro desconhecido'}`)
        return
      }
      await loadTemplates()
    } catch (error: any) {
      console.error('Erro ao deletar template:', error)
      alert(`Erro ao deletar template: ${error.message || 'Erro desconhecido'}`)
    }
  }

  return (
    <CRUDTable
      title="Templates de Proposta"
      modalSize="xl"
      columns={[
        {
          key: 'stepKey',
          label: 'Step',
          render: (value) => {
            const step = PROPOSAL_STEPS.find(s => s.key === value)
            return step ? `Step ${step.number}: ${step.title}` : value
          },
        },
        { key: 'name', label: 'Nome' },
        {
          key: 'version',
          label: 'Versão',
          render: (value) => `v${value}`,
        },
        {
          key: 'active',
          label: 'Status',
          render: (value) => (value ? 'Ativo' : 'Inativo'),
        },
      ]}
      data={templates}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={loading}
      formFields={(data, onChange) => {
        const currentStep = data?.stepKey
          ? PROPOSAL_STEPS.find(s => s.key === data.stepKey)
          : null

        return (
          <>
            <Select
              label="Step"
              value={data?.stepNumber || currentStep?.number || ''}
              onChange={(e) => {
                const stepNum = parseInt(e.target.value)
                const step = PROPOSAL_STEPS.find(s => s.number === stepNum)
                if (step) {
                  onChange?.('stepNumber', stepNum)
                  onChange?.('stepKey', step.key)
                  if (!data?.name) {
                    onChange?.('name', `Proposta - ${step.title}`)
                  }
                }
              }}
              options={PROPOSAL_STEPS.map(step => ({
                value: step.number.toString(),
                label: `Step ${step.number}: ${step.title}`,
              }))}
            />
            <Input
              label="Nome do Template"
              value={data?.name || ''}
              onChange={(e) => onChange?.('name', e.target.value)}
            />
            <Textarea
              label="Conteúdo do Prompt"
              rows={20}
              value={data?.content || ''}
              onChange={(e) => onChange?.('content', e.target.value)}
            />
            <div className="text-xs text-gray-500 space-y-1 mb-4">
              <p><strong>Placeholders disponíveis:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{'{{TRANSCRIPT}}'} - Transcrição da reunião</li>
                <li>{'{{CLIENT_NAME}}'} - Nome do cliente</li>
                <li>{'{{CLIENT_COMPANY}}'} - Empresa do cliente</li>
                <li>{'{{CLIENT_LEAD_NAME}}'} - Nome do contato/lead</li>
                <li>{'{{CLOSER_NAME}}'} - Nome do closer</li>
                <li>{'{{MEETING_DATE}}'} - Data da reunião</li>
                <li>{'{{REPORT_JSON}}'} - JSON completo do relatório</li>
                <li>{'{{REPORT_SUMMARY}}'} - Resumo do relatório</li>
                <li>{'{{STEP_OUTPUT_PREV}}'} - Saída do step anterior</li>
                <li>{'{{STEP1_OUTPUT}}'} ... {'{{STEP10_OUTPUT}}'} - Saída de step específico</li>
                <li>{'{{CLOSER_NOTES}}'} - Considerações do closer</li>
                <li>{'{{CLOSER_ANSWERS}}'} - Respostas do closer (step 2)</li>
                <li>{'{{QUESTIONS_JSON}}'} - JSON com perguntas (step 2)</li>
              </ul>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={data?.active || false}
                onChange={(e) => onChange?.('active', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Ativo (desativa outros do mesmo step)</label>
            </div>
            {data?.id && (
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={data?.createNewVersion || false}
                  onChange={(e) => onChange?.('createNewVersion', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Criar nova versão ao salvar</label>
              </div>
            )}
          </>
        )
      }}
    />
  )
}

function PromptStepTab({ stepKey }: { stepKey: string }) {
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const step = PROPOSAL_STEPS.find(s => s.key === stepKey)

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompt-templates')
      const data = await res.json()
      // Buscar template ativo para este stepKey
      const stepTemplate = (data.templates || []).find((t: any) => 
        t.category === 'proposal' && t.stepKey === stepKey && t.active
      )
      setTemplate(stepTemplate || null)
    } catch (error) {
      console.error('Erro ao carregar template:', error)
      alert('Erro ao carregar template')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplate()
  }, [stepKey])

  const handleSave = async () => {
    if (!template) return

    try {
      // Desativar outros templates do mesmo stepKey
      const res = await fetch('/api/prompt-templates')
      const data = await res.json()
      const sameStepTemplates = (data.templates || []).filter((t: any) => 
        t.category === 'proposal' && t.stepKey === stepKey && t.active && t.id !== template.id
      )
      
      for (const t of sameStepTemplates) {
        await fetch(`/api/prompt-templates/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false }),
        })
      }

      // Criar nova versão ativa
      await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          content: template.content,
          category: 'proposal',
          stepKey: stepKey,
          active: true,
        }),
      })

      loadTemplate()
      alert('Template salvo e ativado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert('Erro ao salvar template')
    }
  }

  const handleCreateNew = async () => {
    try {
      const res = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Proposta - ${step?.title}`,
          content: '',
          category: 'proposal',
          stepKey: stepKey,
          active: true,
        }),
      })

      const data = await res.json()
      loadTemplate()
      if (data.template) {
        setTemplate(data.template)
      }
    } catch (error) {
      console.error('Erro ao criar template:', error)
      alert('Erro ao criar template')
    }
  }

  if (loading) {
    return <div className="text-gray-600">Carregando...</div>
  }

  if (!template) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="mb-4">Nenhum template encontrado para este step.</p>
        <Button onClick={handleCreateNew}>Criar Template</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step?.title} (Step {step?.number})
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure o prompt template para gerar o conteúdo desta etapa.
        </p>
      </div>

      <div className="mb-4">
        <Input
          label="Nome do Template"
          value={template.name || ''}
          onChange={(e) =>
            setTemplate({ ...template, name: e.target.value })
          }
        />
      </div>

      <div className="mb-4">
        <Textarea
          label="Conteúdo do Prompt"
          rows={25}
          value={template.content || ''}
          onChange={(e) =>
            setTemplate({ ...template, content: e.target.value })
          }
        />
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <p><strong>Placeholders disponíveis:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{'{{TRANSCRIPT}}'} - Transcrição da reunião</li>
            <li>{'{{CLIENT_NAME}}'} - Nome do cliente</li>
            <li>{'{{CLIENT_COMPANY}}'} - Empresa do cliente</li>
            <li>{'{{CLIENT_LEAD_NAME}}'} - Nome do contato/lead</li>
            <li>{'{{CLOSER_NAME}}'} - Nome do closer</li>
            <li>{'{{MEETING_DATE}}'} - Data da reunião</li>
            <li>{'{{REPORT_JSON}}'} - JSON completo do relatório</li>
            <li>{'{{REPORT_SUMMARY}}'} - Resumo do relatório</li>
            <li>{'{{STEP_OUTPUT_PREV}}'} - Saída do step anterior</li>
            <li>{'{{STEP1_OUTPUT}}'} ... {'{{STEP10_OUTPUT}}'} - Saída de step específico</li>
            <li>{'{{CLOSER_NOTES}}'} - Considerações do closer</li>
            <li>{'{{CLOSER_ANSWERS}}'} - Respostas do closer (step 2)</li>
            <li>{'{{QUESTIONS_JSON}}'} - JSON com perguntas (step 2)</li>
          </ul>
          {stepKey === 'proposal.step2.questions' && (
            <p className="mt-2 text-orange-600">
              <strong>Importante:</strong> Para o Step 2, retorne um JSON válido com um array de objetos. 
              Cada objeto deve ter: id, pergunta, por_que_importa, exemplo_resposta.
            </p>
          )}
        </div>
      </div>
      <Button onClick={handleSave}>Salvar e Ativar Template</Button>
    </div>
  )
}
