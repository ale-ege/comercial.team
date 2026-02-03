'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SidebarLayoutProps {
  children: React.ReactNode
  currentModule: 'agente-comercial' | 'criador-proposta' | 'base-conhecimento' | 'configuracoes'
}

export default function SidebarLayout({ children, currentModule }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setSessionUser(data.user ? { name: data.user.name, email: data.user.email } : null))
      .catch(() => setSessionUser(null))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }
  
  // Tenta carregar logo automaticamente
  // Adicione sua imagem em /public/logo.png, /public/logo.jpg, /public/logo.svg, etc.
  const logoPath = '/logo.png' // Altere para o nome do seu arquivo se necessário

  const agenteComercialItems = [
    { href: '/', label: 'Análise', icon: '📊' },
    { href: '/resultados', label: 'Resultados', icon: '📋' },
    { href: '/dashboards', label: 'Dashboards', icon: '📈' },
    { href: '/funil-vendas', label: 'Funil de Vendas', icon: '🔻' },
    { href: '/geracao-lead', label: 'Geração de Lead', icon: '📥' },
  ]

  const configuracoesItems = [
    { href: '/configuracoes/usuarios', label: 'Usuários', icon: '👤' },
    { href: '/configuracoes', label: 'Metas e integrações', icon: '⚙️' },
  ]

  const criadorPropostaItems = [
    { href: '/propostas', label: 'Criar Proposta', icon: '📝' },
    { href: '/propostas/lista', label: 'Minhas Propostas', icon: '📑' },
    { href: '/propostas/configuracoes', label: 'Configurações', icon: '⚙️' },
  ]

  const baseConhecimentoItems = [
    { href: '/base-conhecimento', label: 'Base de Conhecimento', icon: '📚' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex print:bg-white">
      {/* Sidebar - oculto na impressão */}
      <aside
          data-print-hide
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white shadow-lg transition-all duration-300 flex flex-col print:hidden`}
        >
        {/* Logo/Imagem no topo */}
        <div className="h-32 flex items-center justify-center border-b border-gray-200 bg-transparent relative overflow-hidden">
          {sidebarOpen ? (
            <div className="flex items-center justify-center px-4 relative z-10 w-full h-full">
              {!logoError ? (
                <div className="relative w-full h-full flex items-center justify-center logo-transparent">
                  <Image 
                    src={logoPath}
                    alt="GETTER AMPLIFIED INDUSTRY" 
                    width={240} 
                    height={80} 
                    className="object-contain h-full w-auto max-h-24 logo-transparent"
                    style={{ 
                      display: logoLoaded ? 'block' : 'none',
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      mixBlendMode: 'normal'
                    }}
                    onError={() => setLogoError(true)}
                    onLoad={() => setLogoLoaded(true)}
                    priority
                  />
                  {!logoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-100 rounded-lg px-6 py-2 border border-gray-200">
                        <span className="text-gray-700 font-bold text-xl">Agente Comercial</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg px-6 py-2 border border-gray-200">
                  <span className="text-gray-700 font-bold text-xl">Agente Comercial</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              {!logoError ? (
                <div className="relative w-12 h-12 flex items-center justify-center logo-transparent">
                  <Image 
                    src={logoPath}
                    alt="GETTER" 
                    width={48} 
                    height={48} 
                    className="object-contain w-full h-full logo-transparent"
                    style={{ 
                      display: logoLoaded ? 'block' : 'none',
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      mixBlendMode: 'normal'
                    }}
                    onError={() => setLogoError(true)}
                    onLoad={() => setLogoLoaded(true)}
                  />
                  {!logoLoaded && (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">G</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu de Módulos */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Agente Comercial - Módulo Principal */}
          <div className="mb-4">
            <div
              className={`px-4 py-2 mx-2 mb-2 ${
                currentModule === 'agente-comercial'
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : ''
              }`}
            >
              <Link
                href="/"
                className={`flex items-center py-2 rounded-lg transition-colors ${
                  currentModule === 'agente-comercial'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl mr-3">💼</span>
                {sidebarOpen && (
                  <span className="font-semibold text-base">Agente Comercial</span>
                )}
              </Link>
            </div>

            {/* Submenu do Agente Comercial */}
            {currentModule === 'agente-comercial' && sidebarOpen && (
              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-1">
                {agenteComercialItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Criador de Proposta - Módulo Principal */}
          <div className="mb-4">
            <div
              className={`px-4 py-2 mx-2 mb-2 ${
                currentModule === 'criador-proposta'
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : ''
              }`}
            >
              <Link
                href="/propostas"
                className={`flex items-center py-2 rounded-lg transition-colors ${
                  currentModule === 'criador-proposta'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl mr-3">📄</span>
                {sidebarOpen && (
                  <span className="font-semibold text-base">Criador de Proposta</span>
                )}
              </Link>
            </div>

            {/* Submenu do Criador de Proposta */}
            {currentModule === 'criador-proposta' && sidebarOpen && (
              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-1">
                {criadorPropostaItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Base de Conhecimento - Módulo Principal */}
          <div className="mb-4">
            <div
              className={`px-4 py-2 mx-2 mb-2 ${
                currentModule === 'base-conhecimento'
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : ''
              }`}
            >
              <Link
                href="/base-conhecimento"
                className={`flex items-center py-2 rounded-lg transition-colors ${
                  currentModule === 'base-conhecimento'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl mr-3">🧠</span>
                {sidebarOpen && (
                  <span className="font-semibold text-base">Base de Conhecimento</span>
                )}
              </Link>
            </div>

            {/* Submenu da Base de Conhecimento */}
            {currentModule === 'base-conhecimento' && sidebarOpen && (
              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-1">
                {baseConhecimentoItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Configurações - Módulo */}
          <div className="mb-4">
            <div
              className={`px-4 py-2 mx-2 mb-2 ${
                currentModule === 'configuracoes'
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : ''
              }`}
            >
              <Link
                href="/configuracoes"
                className={`flex items-center py-2 rounded-lg transition-colors ${
                  currentModule === 'configuracoes'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl mr-3">⚙️</span>
                {sidebarOpen && (
                  <span className="font-semibold text-base">Configurações</span>
                )}
              </Link>
            </div>

            {currentModule === 'configuracoes' && sidebarOpen && (
              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-1">
                {configuracoesItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/configuracoes' ? pathname === '/configuracoes' : pathname?.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Usuário e Sair */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {sessionUser && sidebarOpen && (
            <div className="text-xs text-gray-600 truncate px-2" title={sessionUser.email}>
              {sessionUser.name}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            Sair
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span className="ml-2 text-sm">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-gray-50 min-w-0 print:bg-white">
        <div className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8 print:max-w-none print:py-4 print:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
