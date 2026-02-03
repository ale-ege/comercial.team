import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agente Comercial - Análise de Transcrições',
  description: 'Sistema de análise de transcrições de reuniões de vendas usando IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}