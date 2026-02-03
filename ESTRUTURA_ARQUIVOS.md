# 📁 Estrutura de Arquivos do Projeto - Agente Comercial

## Árvore Completa de Diretórios e Arquivos

```
agente-comercial/
│
├── 📄 .env                              # Variáveis de ambiente (não versionado)
├── 📄 .gitignore                        # Arquivos ignorados pelo Git
├── 📄 package.json                      # Dependências e scripts npm
├── 📄 package-lock.json                 # Lock file das dependências
├── 📄 tsconfig.json                     # Configuração TypeScript
├── 📄 tailwind.config.ts                # Configuração Tailwind CSS
├── 📄 postcss.config.js                 # Configuração PostCSS
├── 📄 next.config.js                    # Configuração Next.js
├── 📄 next-env.d.ts                     # Tipos do Next.js (gerado)
│
├── 📂 app/                              # Aplicação Next.js (App Router)
│   │
│   ├── 📄 layout.tsx                    # Layout raiz (metadata, fontes)
│   ├── 📄 page.tsx                      # Página principal: Análise de Transcrição
│   ├── 📄 globals.css                   # Estilos globais + @media print para PDF
│   │
│   ├── 📂 api/                          # API Routes (Backend - Serverless)
│   │   │
│   │   ├── 📂 analyze/
│   │   │   └── 📄 route.ts             # POST /api/analyze
│   │   │                               #   - Processa transcrição
│   │   │                               #   - Chama OpenAI API
│   │   │                               #   - Cria Meeting e Report
│   │   │
│   │   ├── 📂 clients/                 # CRUD de Clientes
│   │   │   ├── 📄 route.ts             # GET/POST /api/clients
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/PUT/DELETE /api/clients/:id
│   │   │
│   │   ├── 📂 closers/                  # CRUD de Closers
│   │   │   ├── 📄 route.ts             # GET/POST /api/closers
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/PUT/DELETE /api/closers/:id
│   │   │
│   │   ├── 📂 criteria/                 # CRUD de Critérios
│   │   │   ├── 📄 route.ts             # GET/POST /api/criteria
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/PUT/DELETE /api/criteria/:id
│   │   │
│   │   ├── 📂 dashboard/
│   │   │   └── 📂 stats/
│   │   │       └── 📄 route.ts         # GET /api/dashboard/stats
│   │   │                               #   - KPIs e métricas
│   │   │                               #   - Agregações e normalizações
│   │   │                               #   - Query params: closerId, clientId, startDate, endDate
│   │   │
│   │   ├── 📂 meetings/
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/PUT /api/meetings/:id
│   │   │                               #   - Editar dados da reunião
│   │   │                               #   - Atualizar clientId, closerId, createdAt
│   │   │
│   │   ├── 📂 model-config/            # Configuração do Modelo de IA
│   │   │   ├── 📄 route.ts             # GET/POST /api/model-config
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # PUT /api/model-config/:id
│   │   │
│   │   ├── 📂 prompt-templates/        # CRUD de Templates de Prompt
│   │   │   ├── 📄 route.ts             # GET/POST /api/prompt-templates
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/PUT/DELETE /api/prompt-templates/:id
│   │   │
│   │   ├── 📂 reports/                 # Relatórios
│   │   │   ├── 📄 route.ts             # GET /api/reports (lista com filtros)
│   │   │   └── 📂 [id]/
│   │   │       └── 📄 route.ts         # GET/DELETE /api/reports/:id
│   │   │
│   │   └── 📂 resultados/
│   │       └── 📄 route.ts             # GET /api/resultados
│   │                                   #   - Lista processada para página de resultados
│   │                                   #   - Inclui Meeting, Client, Closer
│   │
│   ├── 📂 configuracoes/              # Módulo: Agente Comercial > Configurações
│   │   └── 📄 page.tsx                 # Tabs:
│   │                                   #   - Closers (CRUD)
│   │                                   #   - Clientes (CRUD)
│   │                                   #   - Critérios (CRUD)
│   │                                   #   - Model/Parâmetros
│   │                                   #   - Prompt Template
│   │
│   ├── 📂 dashboards/                  # Módulo: Agente Comercial > Dashboards
│   │   └── 📄 page.tsx                 # Visualizações:
│   │                                   #   - KPIs (média geral, total, closers ativos)
│   │                                   #   - Ranking de Closers (interativo)
│   │                                   #   - Evolução Mensal (linha)
│   │                                   #   - Distribuição por Critério (radar)
│   │                                   #   - Heatmap Closer x Critério
│   │                                   #   - Filtros e exportação PDF
│   │
│   ├── 📂 resultados/                  # Módulo: Agente Comercial > Resultados
│   │   └── 📄 page.tsx                 # Lista de relatórios:
│   │                                   #   - Tabela com Closer, Filename, Date, Client, Score
│   │                                   #   - Ações: Editar (modal) e Excluir
│   │                                   #   - Filtros visuais por nota
│   │
│   ├── 📂 relatorio/                   # Visualização de Relatório Individual
│   │   └── 📂 [id]/
│   │       └── 📄 page.tsx             # Relatório completo:
│   │                                   #   - Informações da reunião (Closer, Cliente, Data)
│   │                                   #   - Nota geral
│   │                                   #   - Resumo executivo
│   │                                   #   - Gráficos (Radar e Barras)
│   │                                   #   - Análise por critério
│   │                                   #   - Plano de ação
│   │                                   #   - Compromissos (closer e lead)
│   │                                   #   - Metadados
│   │                                   #   - Exportação PDF e JSON
│   │
│   └── 📂 propostas/                   # Módulo: Criador de Proposta (em desenvolvimento)
│       ├── 📄 page.tsx                 # Criar Proposta
│       ├── 📂 lista/
│       │   └── 📄 page.tsx             # Minhas Propostas
│       └── 📂 configuracoes/
│           └── 📄 page.tsx             # Configurações:
│                                       #   - Model/Parâmetros
│                                       #   - Prompt Template (filtrado por "proposta")
│
├── 📂 components/                      # Componentes React Reutilizáveis
│   │
│   ├── 📄 Button.tsx                   # Botão estilizado
│   │                                   #   - Variantes: primary, secondary, danger
│   │                                   #   - Tamanhos: sm, md, lg
│   │                                   #   - Estados: loading, disabled
│   │
│   ├── 📄 Input.tsx                    # Input de texto
│   │                                   #   - Suporte a label, error, placeholder
│   │                                   #   - Tipos: text, email, number, etc.
│   │
│   ├── 📄 Textarea.tsx                 # Textarea
│   │                                   #   - Suporte a label, error
│   │                                   #   - Auto-resize opcional
│   │
│   ├── 📄 Select.tsx                   # Select dropdown
│   │                                   #   - Usa Radix UI Select
│   │                                   #   - Suporte a label, error, placeholder
│   │
│   ├── 📄 Modal.tsx                    # Modal genérico
│   │                                   #   - Tamanhos: sm, md, lg, xl, full
│   │                                   #   - Usa Radix UI Dialog
│   │                                   #   - Suporte a título, footer, fechamento
│   │
│   ├── 📄 CRUDTable.tsx                # Tabela CRUD genérica
│   │                                   #   - Criar, Editar, Deletar
│   │                                   #   - Ativar/Desativar
│   │                                   #   - Modal integrado
│   │                                   #   - Configurável por colunas e campos
│   │
│   ├── 📄 SidebarLayout.tsx            # Layout principal com sidebar
│   │                                   #   - Sidebar colapsável
│   │                                   #   - Navegação modular (Agente Comercial / Criador de Proposta)
│   │                                   #   - Logo no topo
│   │                                   #   - Responsivo
│   │                                   #   - Oculto na impressão (@media print)
│   │
│   └── 📄 Layout.tsx                   # Layout básico (legado?)
│
├── 📂 lib/                             # Bibliotecas e Utilitários
│   │
│   ├── 📄 prisma.ts                    # Cliente Prisma (singleton)
│   │                                   #   - Instância única para evitar múltiplas conexões
│   │                                   #   - Exporta PrismaClient
│   │
│   ├── 📄 openai.ts                    # Integração OpenAI API
│   │                                   #   - Função analyzeTranscript()
│   │                                   #   - Construção dinâmica de prompt
│   │                                   #   - Busca critérios, template, config
│   │                                   #   - Chamada à API com parâmetros configuráveis
│   │                                   #   - Validação e normalização de resposta
│   │                                   #   - Suporte a GPT-4 e GPT-5 (max_completion_tokens)
│   │
│   └── 📄 validations.ts               # Schemas Zod para validação
│                                       #   - analyzeRequestSchema
│                                       #   - analyzeResponseSchema
│                                       #   - criterionScoreSchema
│                                       #   - actionPlanItemSchema
│                                       #   - commitmentActionSchema
│                                       #   - commitmentsSchema
│                                       #   - metadataSchema
│                                       #   - Schemas para CRUD (clients, closers, criteria)
│
├── 📂 prisma/                          # Prisma ORM
│   │
│   ├── 📄 schema.prisma                # Schema do banco de dados
│   │                                   #   - Models: Closer, Client, Criterion, Meeting, Report,
│   │                                   #            PromptTemplate, ModelConfig
│   │                                   #   - Relacionamentos e índices
│   │                                   #   - Provider: sqlite (dev) / postgresql (prod)
│   │
│   ├── 📄 seed.ts                      # Seed com dados iniciais
│   │                                   #   - 8 critérios padrão
│   │                                   #   - Prompt template padrão
│   │                                   #   - Model config padrão
│   │                                   #   - Executado com: npm run db:seed
│   │
│   └── 📄 package.json                 # (legado? - pode ser removido)
│
├── 📂 public/                          # Arquivos Estáticos
│   │
│   ├── 📄 logo.png                     # Logo da aplicação (sidebar)
│   ├── 📄 header-logo.png              # Logo do header (se aplicável)
│   └── 📄 README.md                    # Documentação de assets
│
├── 📂 .next/                           # Build do Next.js (gerado, não versionado)
│   │                                   #   - Arquivos compilados
│   │                                   #   - Cache
│   │                                   #   - Tipos gerados
│   │
├── 📂 node_modules/                   # Dependências npm (não versionado)
│
└── 📄 Arquivos de Documentação
    │
    ├── 📄 DOCUMENTACAO_PROJETO.md      # Documentação completa do projeto
    ├── 📄 ESTRUTURA_ARQUIVOS.md        # Este arquivo (estrutura visual)
    ├── 📄 ESTRUTURA_PROJETO.md         # (se existir)
    ├── 📄 QUICK_START.md               # Guia rápido de início
    ├── 📄 README.md                    # Documentação básica
    └── 📄 EXEMPLO_TRANSCRICAO.txt      # Exemplo de transcrição para testes
```

---

## 📊 Estatísticas do Projeto

### Por Tipo de Arquivo

- **TypeScript/TSX**: ~40 arquivos
- **API Routes**: 15 endpoints
- **Páginas**: 8 páginas principais
- **Componentes**: 8 componentes reutilizáveis
- **Bibliotecas**: 3 utilitários principais

### Por Funcionalidade

- **Backend (API)**: 15 rotas
- **Frontend (Pages)**: 8 páginas
- **Componentes UI**: 8 componentes
- **Validação**: 10+ schemas Zod
- **Modelos de Dados**: 7 entidades Prisma

---

## 🔍 Localização de Funcionalidades Específicas

### Análise de Transcrição
- **Frontend**: `app/page.tsx`
- **Backend**: `app/api/analyze/route.ts`
- **Lógica IA**: `lib/openai.ts`
- **Validação**: `lib/validations.ts`

### Relatórios
- **Visualização**: `app/relatorio/[id]/page.tsx`
- **API**: `app/api/reports/[id]/route.ts`
- **Lista**: `app/resultados/page.tsx` + `app/api/resultados/route.ts`

### Dashboards
- **Frontend**: `app/dashboards/page.tsx`
- **API**: `app/api/dashboard/stats/route.ts`
- **Gráficos**: Recharts (RadarChart, BarChart, LineChart)

### Configurações
- **Frontend**: `app/configuracoes/page.tsx`
- **APIs**: 
  - `app/api/closers/`
  - `app/api/clients/`
  - `app/api/criteria/`
  - `app/api/model-config/`
  - `app/api/prompt-templates/`

### CRUD Genérico
- **Componente**: `components/CRUDTable.tsx`
- **Modal**: `components/Modal.tsx`
- **Inputs**: `components/Input.tsx`, `components/Select.tsx`, `components/Textarea.tsx`

### Layout e Navegação
- **Layout Principal**: `components/SidebarLayout.tsx`
- **Layout Raiz**: `app/layout.tsx`
- **Estilos Globais**: `app/globals.css`

### Banco de Dados
- **Schema**: `prisma/schema.prisma`
- **Seed**: `prisma/seed.ts`
- **Cliente**: `lib/prisma.ts`

---

## 🎯 Convenções de Nomenclatura

### Arquivos e Pastas
- **Páginas**: `page.tsx` (App Router)
- **API Routes**: `route.ts`
- **Componentes**: PascalCase (`Button.tsx`, `SidebarLayout.tsx`)
- **Utilitários**: camelCase (`openai.ts`, `validations.ts`)

### Rotas
- **Páginas**: `/`, `/resultados`, `/dashboards`, `/configuracoes`
- **API**: `/api/[resource]`, `/api/[resource]/[id]`
- **Dinâmicas**: `[id]` para IDs, `[...slug]` para catch-all

### Componentes
- **Props**: TypeScript interfaces
- **Estados**: `useState`, `useEffect`
- **Navegação**: `next/navigation` (App Router)

---

## 📝 Notas Importantes

1. **App Router**: Projeto usa Next.js 14 App Router (não Pages Router)
2. **Server Components**: Por padrão, componentes são Server Components
3. **Client Components**: Marcados com `'use client'` quando necessário
4. **API Routes**: Todas as rotas API são Serverless Functions
5. **Prisma**: Cliente gerado com `prisma generate`
6. **TypeScript**: Tipagem estrita habilitada
7. **Tailwind**: Configuração customizada em `tailwind.config.ts`
8. **Print Styles**: Otimizado para PDF em `globals.css` com `@media print`

---

**Última atualização**: Janeiro 2026
