'use client'

import { useState } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import ContextosTab from './components/ContextosTab'
import DocumentosTab from './components/DocumentosTab'
import ProcessamentoTab from './components/ProcessamentoTab'
import BuscaTab from './components/BuscaTab'
import ChatTab from './components/ChatTab'

export default function BaseConhecimentoPage() {
  const [activeTab, setActiveTab] = useState('contextos')

  const tabs = [
    { id: 'contextos', label: 'Contextos', icon: '📚' },
    { id: 'documentos', label: 'Documentos', icon: '📄' },
    { id: 'processamento', label: 'Processamento', icon: '⚙️' },
    { id: 'busca', label: 'Busca e Teste', icon: '🔍' },
    { id: 'chat', label: 'Chat', icon: '💬' },
  ]

  return (
    <SidebarLayout currentModule="base-conhecimento">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Base de Conhecimento</h1>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'contextos' && <ContextosTab />}
            {activeTab === 'documentos' && <DocumentosTab />}
            {activeTab === 'processamento' && <ProcessamentoTab />}
            {activeTab === 'busca' && <BuscaTab />}
            {activeTab === 'chat' && <ChatTab />}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
