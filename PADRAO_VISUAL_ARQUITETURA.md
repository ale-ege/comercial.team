# Padrão Visual e Arquitetura - Agente Comercial

Documento de referência para replicar o padrão visual e arquitetura deste projeto em novos projetos.

---

## 🎨 Padrão Visual

### Sistema de Cores

**Paleta Principal:**
- **Azul primário:** `#2563eb` (blue-600) - botões principais, destaques, links ativos
- **Azul secundário:** `#1d4ed8` (blue-700) - hover de botões, gradientes
- **Azul claro:** `#dbeafe` (blue-50) - fundos de destaque, estados ativos
- **Azul médio:** `#93c5fd` (blue-100) - itens de menu ativos

**Cores Neutras:**
- **Fundo geral:** `#f9fafb` (gray-50)
- **Fundo cards:** `#ffffff` (white)
- **Texto principal:** `#111827` (gray-900)
- **Texto secundário:** `#374151` (gray-700)
- **Texto terciário:** `#6b7280` (gray-500)
- **Bordas:** `#e5e7eb` (gray-200)

**Cores de Status:**
- **Sucesso:** `#22c55e` (green-600)
- **Aviso:** `#eab308` (yellow-500)
- **Erro:** `#ef4444` (red-600)
- **Info:** `#3b82f6` (blue-600)

### Tipografia

- **Fonte base:** System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...`)
- **Títulos (h1):** `text-3xl font-bold` (30px, bold)
- **Títulos (h2):** `text-xl font-semibold` (20px, semibold)
- **Títulos (h3):** `text-lg font-medium` (18px, medium)
- **Texto normal:** `text-sm` ou `text-base` (14px ou 16px)
- **Texto pequeno:** `text-xs` (12px)
- **Labels:** `text-sm font-medium text-gray-700`

### Componentes Visuais

#### Botões

```tsx
// Variantes: primary (azul), secondary (cinza), danger (vermelho)
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger">Excluir</Button>
<Button loading={true}>Processando...</Button>
```

**Estilo:**
- Padding: `px-4 py-2`
- Border radius: `rounded-md`
- Font weight: `font-medium`
- Transições suaves: `transition-colors`
- Focus ring: `focus:ring-2 focus:ring-offset-2`
- Estados disabled: `opacity-50 cursor-not-allowed`

#### Cards

```tsx
<div className="bg-white shadow rounded-lg p-6 mb-6">
  {/* Conteúdo */}
</div>
```

**Características:**
- Fundo branco: `bg-white`
- Sombra: `shadow` (sombra padrão do Tailwind)
- Border radius: `rounded-lg`
- Padding padrão: `p-6`
- Margin bottom: `mb-6`

#### Inputs e Formulários

```tsx
<Input
  label="Nome"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Digite o nome"
  required
/>
```

**Estilo:**
- Label: `text-sm font-medium text-gray-700`
- Input: `border border-gray-300 rounded-md px-3 py-2`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- Placeholder: `text-gray-400`

#### Tabelas

```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Coluna
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* Linhas */}
  </tbody>
</table>
```

### Layout Principal

#### Sidebar

**Características:**
- Largura expandida: `w-64` (256px)
- Largura recolhida: `w-20` (80px)
- Fundo: `bg-white`
- Sombra: `shadow-lg`
- Transição: `transition-all duration-300`
- Scroll interno: `overflow-y-auto`

**Estrutura:**
1. **Logo/Header** (topo, altura fixa ~128px)
   - Logo com fallback para texto
   - Suporte a imagem transparente
   - Versão compacta quando sidebar recolhida

2. **Menu de Módulos** (flex-1, scroll)
   - Módulos principais com ícones emoji (💼, 📄, 🧠, ⚙️)
   - Submenus indentados com borda esquerda azul
   - Estado ativo: `bg-blue-100 text-blue-700`
   - Hover: `hover:bg-gray-50`

3. **Rodapé** (fixo na parte inferior)
   - Informações do usuário
   - Botão "Sair" (vermelho)
   - Botão recolher/expandir sidebar

**Cores do Menu:**
- Item ativo: `bg-blue-50 border-l-4 border-blue-600`
- Subitem ativo: `bg-blue-100 text-blue-700 font-medium`
- Item inativo: `text-gray-600 hover:bg-gray-50`

#### Conteúdo Principal

```tsx
<main className="flex-1 overflow-y-auto bg-gray-50 min-w-0">
  <div className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
    {/* Conteúdo */}
  </div>
</main>
```

**Características:**
- Fundo: `bg-gray-50`
- Largura máxima: `max-w-[1600px]`
- Padding responsivo: `px-4 sm:px-6 lg:px-8`
- Padding vertical: `py-6`

### Destaques e Badges

#### Nota/Destaque Principal

```tsx
<div style={{
  background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
  color: '#ffffff',
}}>
  <span style={{ color: 'rgba(255,255,255,0.9)' }}>Nota Geral</span>
  <span style={{ color: '#ffffff' }}>68.2</span>
</div>
```

**Características:**
- Gradiente azul: `linear-gradient(to right, #2563eb, #1d4ed8)`
- Texto branco com opacidade variável
- Uso de **estilos inline** para garantir renderização imediata (evita problemas de CSS carregando depois)

#### Badges de Status

```tsx
<span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
  Indexado
</span>
```

**Cores por status:**
- Pendente: `bg-yellow-100 text-yellow-800`
- Processando: `bg-blue-100 text-blue-800`
- Sucesso/Indexado: `bg-green-100 text-green-800`
- Erro: `bg-red-100 text-red-800`

### Modais

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título do Modal"
  size="md" // md, lg, xl
  footer={<Button>Salvar</Button>}
>
  {/* Conteúdo */}
</Modal>
```

**Características:**
- Overlay escuro: `bg-gray-500/75`
- Card centralizado: `max-w-3xl` (md), `max-w-4xl` (lg), `max-w-6xl` (xl)
- Header com título e botão fechar (✕)
- Footer opcional com ações
- Scroll interno se conteúdo grande

### Gráficos (Recharts)

**Padrões:**
- Container responsivo: `ResponsiveContainer width="100%" height={400}`
- Cores consistentes com paleta (azul para dados principais)
- Tooltips customizados com fundo branco e borda
- Labels com tamanho adequado para impressão

### Impressão/PDF

**Classes especiais:**
- `.no-print` ou `print:hidden` - ocultar na impressão
- `.print-card` - remover sombra, adicionar borda
- `.print-keep-together` - evitar quebra de página
- `.print-first-page-content` - manter junto na primeira página

**Estilos globais:**
- Fonte reduzida: `font-size: 11px`
- Fundo branco: `background: #fff`
- Remover sidebar e navegação
- Ajustar gráficos para caber em página

---

## 🏗️ Arquitetura Técnica

### Stack Principal

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript 5.3+
- **Estilização:** Tailwind CSS 3.4
- **Banco de Dados:** Prisma ORM (SQLite em dev, PostgreSQL em prod)
- **Validação:** Zod 3.22
- **UI Components:** Radix UI (Dialog, Select, Tabs, Dropdown)
- **Gráficos:** Recharts 2.10
- **Datas:** date-fns 2.30
- **IA:** OpenAI API (GPT-4/GPT-5)

### Estrutura de Pastas

```
├── app/
│   ├── api/                    # Rotas da API (Backend)
│   │   ├── [resource]/         # CRUD padrão
│   │   │   ├── route.ts        # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET, PUT, DELETE
│   │   └── [feature]/          # Features específicas
│   ├── [module]/               # Páginas do módulo
│   │   ├── page.tsx            # Página principal
│   │   ├── [id]/
│   │   │   └── page.tsx        # Página de detalhe
│   │   └── configuracoes/      # Subpáginas
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Home
│   └── globals.css             # Estilos globais + @media print
├── components/                 # Componentes React reutilizáveis
│   ├── SidebarLayout.tsx       # Layout com sidebar modular
│   ├── CRUDTable.tsx           # Tabela CRUD genérica
│   ├── Modal.tsx               # Modal genérico
│   ├── Button.tsx              # Botão estilizado
│   ├── Input.tsx               # Input de texto
│   ├── Select.tsx              # Select dropdown
│   └── Textarea.tsx            # Textarea
├── lib/                        # Utilitários e helpers
│   ├── prisma.ts               # Cliente Prisma (singleton)
│   ├── validations.ts          # Schemas Zod
│   └── [feature]/              # Helpers específicos
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── seed.ts                 # Seed com dados iniciais
└── public/                     # Assets estáticos
```

### Padrões de Código

#### Rotas API (App Router)

```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resourceSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const items = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = resourceSchema.parse(body)
    
    const item = await prisma.resource.create({ data })
    return NextResponse.json({ item })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar', details: error.message },
      { status: 500 }
    )
  }
}
```

#### Componentes de Página

```typescript
// app/module/page.tsx
'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import Button from '@/components/Button'

export default function ModulePage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/resource')
      const data = await res.json()
      setData(data.items || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarLayout currentModule="module-name">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Título</h1>
        {/* Conteúdo */}
      </div>
    </SidebarLayout>
  )
}
```

#### Validação com Zod

```typescript
// lib/validations.ts
import { z } from 'zod'

export const resourceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  active: z.boolean().default(true),
})

export type ResourceInput = z.infer<typeof resourceSchema>
```

#### Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Componentes Reutilizáveis

#### CRUDTable Genérico

```typescript
<CRUDTable
  title="Recursos"
  columns={[
    { key: 'name', label: 'Nome' },
    { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> },
  ]}
  data={items}
  onCreate={handleCreate}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  formFields={(data, onChange) => (
    <>
      <Input label="Nome" value={data.name} onChange={(e) => onChange('name', e.target.value)} />
    </>
  )}
  modalSize="lg"
/>
```

#### SidebarLayout Modular

```typescript
<SidebarLayout currentModule="agente-comercial">
  {/* Conteúdo da página */}
</SidebarLayout>
```

**Módulos suportados:**
- `'agente-comercial'`
- `'criador-proposta'`
- `'base-conhecimento'`
- `'configuracoes'`

### Tratamento de Erros

**Padrão em APIs:**
1. Try/catch em todas as rotas
2. Log de erros no console
3. Resposta JSON com `error` e `details`
4. Status HTTP apropriado (400, 404, 500)
5. Mensagens amigáveis ao usuário

**Padrão no Frontend:**
1. Estados de loading e error
2. Try/catch em funções async
3. Alert ou toast para erros
4. Fallback UI quando dados não carregam

### Responsividade

**Breakpoints Tailwind:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

**Padrões:**
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Padding responsivo: `px-4 sm:px-6 lg:px-8`
- Sidebar colapsável em mobile (via estado)

### Acessibilidade

- Labels em todos os inputs
- `aria-label` em botões sem texto
- `title` em elementos interativos
- Focus ring visível em todos os elementos focáveis
- Contraste adequado (texto escuro em fundo claro)

### Performance

- **Client Components:** Apenas quando necessário (`'use client'`)
- **Server Components:** Padrão no App Router
- **Lazy Loading:** Imagens com `next/image`
- **Code Splitting:** Automático pelo Next.js
- **Prisma:** Singleton para evitar múltiplas conexões

---

## 📋 Checklist para Novo Projeto

### Setup Inicial

- [ ] Next.js 14 com App Router
- [ ] TypeScript configurado
- [ ] Tailwind CSS instalado e configurado
- [ ] Prisma instalado e schema criado
- [ ] Zod para validações
- [ ] Componentes base criados (Button, Input, Select, Modal, CRUDTable)
- [ ] SidebarLayout criado
- [ ] globals.css com estilos de impressão

### Estrutura

- [ ] Pastas `app/`, `components/`, `lib/`, `prisma/` criadas
- [ ] Rotas API seguindo padrão `/api/[resource]/route.ts`
- [ ] Páginas usando `SidebarLayout`
- [ ] Validações Zod em `lib/validations.ts`

### Visual

- [ ] Cores da paleta aplicadas
- [ ] Componentes seguindo padrão de estilo
- [ ] Sidebar com logo e menu modular
- [ ] Cards com sombra e bordas arredondadas
- [ ] Botões com variantes (primary, secondary, danger)
- [ ] Tabelas com estilo padrão
- [ ] Modais para formulários

### Funcionalidades

- [ ] CRUD completo para recursos principais
- [ ] Validação de dados (Zod)
- [ ] Tratamento de erros consistente
- [ ] Estados de loading
- [ ] Feedback visual para ações do usuário

---

## 🎯 Princípios de Design

1. **Consistência:** Mesmos padrões visuais em todo o sistema
2. **Clareza:** Informações hierarquizadas, texto legível
3. **Feedback:** Usuário sempre sabe o que está acontecendo (loading, sucesso, erro)
4. **Acessibilidade:** Contraste adequado, navegação por teclado
5. **Responsividade:** Funciona bem em desktop, tablet e mobile
6. **Performance:** Carregamento rápido, interações fluidas

---

## 📝 Notas Importantes

- **Estilos inline para elementos críticos:** Use `style={{}}` para elementos que precisam aparecer imediatamente (ex.: gradientes, cores de fundo importantes)
- **Print-friendly:** Sempre considere como o conteúdo será impresso/exportado
- **TypeScript strict:** Use tipos explícitos, evite `any` quando possível
- **Error handling:** Sempre trate erros, nunca deixe o usuário sem feedback
- **Logging:** Use `console.log` para debug em desenvolvimento, remova ou substitua por logger em produção

---

Este documento serve como guia completo para replicar o padrão visual e arquitetura em novos projetos. Adapte conforme necessário para o contexto específico do novo projeto.
