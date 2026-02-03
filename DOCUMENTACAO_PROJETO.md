# 📋 Documentação Completa do Projeto - Agente Comercial

## 🎯 Visão Geral

**Agente Comercial** é uma aplicação web full-stack desenvolvida para análise automatizada de transcrições de reuniões de vendas usando inteligência artificial (API do ChatGPT/OpenAI). O sistema permite avaliar o desempenho de closers (vendedores) em múltiplos critérios, gerar relatórios detalhados com gráficos e visualizações, e fornecer dashboards com métricas e KPIs para gestão comercial.

### Principais Funcionalidades

1. **Análise de Transcrições**: Processamento de transcrições de reuniões com análise detalhada por critérios
2. **Gestão de Dados**: CRUD completo para Closers, Clientes e Critérios de avaliação
3. **Relatórios Detalhados**: Geração de relatórios com notas, gráficos (radar e barras), planos de ação e compromissos
4. **Dashboards Interativos**: Visualização de KPIs, rankings, evolução mensal e heatmaps
5. **Exportação**: Suporte para exportação em PDF e JSON
6. **Configurações Flexíveis**: Personalização de prompts, modelos de IA e parâmetros

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Banco de Dados**: SQLite (dev) / PostgreSQL (produção) via Prisma ORM
- **Validação**: Zod
- **Visualizações**: Recharts
- **IA**: OpenAI API (GPT-4, GPT-5, etc.)

### Padrões de Arquitetura

- **App Router**: Utiliza o novo sistema de roteamento do Next.js 14
- **Server Components & Client Components**: Separação clara entre componentes servidor e cliente
- **API Routes**: Endpoints RESTful organizados por recurso
- **Type Safety**: TypeScript em todo o código + validação runtime com Zod
- **Component-Based**: Componentes reutilizáveis (Button, Input, Modal, CRUDTable, etc.)

---

## 📁 Estrutura Detalhada de Arquivos

```
agente-comercial/
│
├── 📄 Arquivos de Configuração
│   ├── .env                          # Variáveis de ambiente (API keys, DB URL)
│   ├── .gitignore                    # Arquivos ignorados pelo Git
│   ├── package.json                  # Dependências e scripts npm
│   ├── tsconfig.json                 # Configuração TypeScript
│   ├── tailwind.config.ts            # Configuração Tailwind CSS
│   ├── postcss.config.js             # Configuração PostCSS
│   ├── next.config.js                # Configuração Next.js
│   └── README.md                     # Documentação básica
│
├── 📂 app/                           # Aplicação Next.js (App Router)
│   │
│   ├── 📄 layout.tsx                 # Layout raiz da aplicação
│   ├── 📄 page.tsx                   # Página principal: Análise de Transcrição
│   ├── 📄 globals.css                # Estilos globais + @media print para PDF
│   │
│   ├── 📂 api/                       # API Routes (Backend)
│   │   │
│   │   ├── 📂 analyze/
│   │   │   └── route.ts              # POST /api/analyze - Processa transcrição
│   │   │
│   │   ├── 📂 clients/               # CRUD de Clientes
│   │   │   ├── route.ts              # GET/POST /api/clients
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/clients/:id
│   │   │
│   │   ├── 📂 closers/               # CRUD de Closers
│   │   │   ├── route.ts              # GET/POST /api/closers
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/closers/:id
│   │   │
│   │   ├── 📂 criteria/              # CRUD de Critérios
│   │   │   ├── route.ts              # GET/POST /api/criteria
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/criteria/:id
│   │   │
│   │   ├── 📂 dashboard/
│   │   │   └── stats/
│   │   │       └── route.ts          # GET /api/dashboard/stats - KPIs e métricas
│   │   │
│   │   ├── 📂 meetings/
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT /api/meetings/:id - Editar reunião
│   │   │
│   │   ├── 📂 model-config/          # Configuração do Modelo de IA
│   │   │   ├── route.ts              # GET/POST /api/model-config
│   │   │   └── [id]/
│   │   │       └── route.ts          # PUT /api/model-config/:id
│   │   │
│   │   ├── 📂 prompt-templates/      # CRUD de Templates de Prompt
│   │   │   ├── route.ts              # GET/POST /api/prompt-templates
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/prompt-templates/:id
│   │   │
│   │   ├── 📂 reports/               # Relatórios
│   │   │   ├── route.ts              # GET /api/reports (lista)
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/DELETE /api/reports/:id
│   │   │
│   │   └── 📂 resultados/
│   │       └── route.ts              # GET /api/resultados - Lista processada
│   │
│   ├── 📂 configuracoes/            # Módulo: Agente Comercial > Configurações
│   │   └── page.tsx                  # Tabs: Closers, Clientes, Critérios, Model, Prompt
│   │
│   ├── 📂 dashboards/                # Módulo: Agente Comercial > Dashboards
│   │   └── page.tsx                  # KPIs, Rankings, Gráficos, Heatmap
│   │
│   ├── 📂 resultados/               # Módulo: Agente Comercial > Resultados
│   │   └── page.tsx                  # Lista de relatórios com ações (Editar/Excluir)
│   │
│   ├── 📂 relatorio/                 # Visualização de Relatório Individual
│   │   └── [id]/
│   │       └── page.tsx              # Relatório completo com gráficos e PDF export
│   │
│   └── 📂 propostas/                 # Módulo: Criador de Proposta (em desenvolvimento)
│       ├── page.tsx                  # Criar Proposta
│       ├── lista/
│       │   └── page.tsx              # Minhas Propostas
│       └── configuracoes/
│           └── page.tsx              # Configurações (Model/Prompt)
│
├── 📂 components/                    # Componentes React Reutilizáveis
│   ├── Button.tsx                    # Botão estilizado
│   ├── Input.tsx                     # Input de texto
│   ├── Textarea.tsx                  # Textarea
│   ├── Select.tsx                    # Select dropdown
│   ├── Modal.tsx                     # Modal genérico (tamanhos configuráveis)
│   ├── CRUDTable.tsx                 # Tabela CRUD genérica (criar/editar/deletar)
│   ├── SidebarLayout.tsx             # Layout com sidebar e navegação modular
│   └── Layout.tsx                    # Layout básico (legado?)
│
├── 📂 lib/                           # Bibliotecas e Utilitários
│   ├── prisma.ts                     # Cliente Prisma (singleton)
│   ├── openai.ts                     # Integração OpenAI API + construção de prompt
│   └── validations.ts                 # Schemas Zod para validação
│
├── 📂 prisma/                        # Prisma ORM
│   ├── schema.prisma                 # Schema do banco de dados
│   ├── seed.ts                       # Seed com dados iniciais (critérios, prompt padrão)
│   └── package.json                  # (legado?)
│
├── 📂 public/                        # Arquivos Estáticos
│   ├── logo.png                      # Logo da aplicação
│   ├── header-logo.png               # Logo do header
│   └── README.md                     # Documentação de assets
│
└── 📄 Arquivos de Documentação
    ├── DOCUMENTACAO_PROJETO.md       # Este arquivo
    ├── ESTRUTURA_PROJETO.md          # (se existir)
    ├── QUICK_START.md                # Guia rápido
    └── EXEMPLO_TRANSCRICAO.txt       # Exemplo de transcrição para testes
```

---

## 🗄️ Modelo de Dados (Prisma Schema)

### Entidades Principais

#### 1. **Closer** (Vendedor)
- `id`: Identificador único
- `name`: Nome do closer
- `email`: Email (opcional, único)
- `active`: Status ativo/inativo
- `meetings`: Relacionamento 1:N com Meeting

#### 2. **Client** (Cliente)
- `id`: Identificador único
- `name`: Nome do cliente
- `email`: Email (opcional)
- `company`: Empresa (opcional)
- `phone`: Telefone (opcional)
- `leadName`: Nome do contato/lead (opcional)
- `active`: Status ativo/inativo
- `meetings`: Relacionamento 1:N com Meeting

#### 3. **Criterion** (Critério de Avaliação)
- `id`: Identificador único
- `name`: Nome do critério
- `description`: Descrição
- `weight`: Peso (padrão: 1.0)
- `examples`: JSON array de exemplos
- `rules`: JSON array de regras
- `goodExamples`: Exemplos do que é bom (opcional)
- `badExamples`: Exemplos do que é ruim (opcional)
- `active`: Status ativo/inativo

#### 4. **Meeting** (Reunião)
- `id`: Identificador único
- `clientId`: FK para Client
- `closerId`: FK para Closer
- `transcript`: Transcrição completa da reunião
- `fileName`: Nome do arquivo (opcional)
- `createdAt`: Data/hora da reunião (editável)
- `report`: Relacionamento 1:1 com Report

#### 5. **Report** (Relatório de Análise)
- `id`: Identificador único
- `meetingId`: FK única para Meeting
- `overallScore`: Nota geral (0-100)
- `criteriaScores`: JSON com notas por critério
- `insights`: JSON com resumo, plano de ação, compromissos, metadados
- `rawModelOutput`: JSON com saída bruta da API
- `createdAt`: Data de criação do relatório

#### 6. **PromptTemplate** (Template de Prompt)
- `id`: Identificador único
- `name`: Nome do template
- `content`: Conteúdo do prompt (com placeholders)
- `active`: Template ativo (apenas um pode estar ativo)
- `version`: Versão do template
- `history`: JSON com histórico de versões (opcional)

#### 7. **ModelConfig** (Configuração do Modelo)
- `id`: Identificador único
- `model`: Nome do modelo (ex: "gpt-5.2", "gpt-4-turbo-preview")
- `temperature`: Temperatura (0-2, apenas se reasoningEffort = "none")
- `topP`: Top P (0-1, apenas se reasoningEffort = "none")
- `maxTokens`: Máximo de tokens (padrão: 8000)
- `reasoningEffort`: Esforço de raciocínio ("none", "low", "medium", "high", "xhigh")
- `verbosity`: Verbosidade ("low", "medium", "high")
- `active`: Configuração ativa (apenas uma pode estar ativa)

---

## 🔄 Fluxos Principais

### 1. Fluxo de Análise de Transcrição

```
Usuário → Página Principal (/)
  ↓
Seleciona Cliente e Closer
  ↓
Upload/Cole Transcrição
  ↓
POST /api/analyze
  ↓
lib/openai.ts:
  - Busca critérios ativos
  - Busca prompt template ativo
  - Busca model config ativo
  - Constrói prompt dinâmico
  - Chama OpenAI API
  - Valida resposta com Zod
  - Normaliza nomes de critérios
  ↓
app/api/analyze/route.ts:
  - Cria Meeting
  - Cria Report com insights
  - Retorna dados formatados
  ↓
Redireciona para /relatorio/[id]
  ↓
Exibe relatório completo com gráficos
```

### 2. Fluxo de Visualização de Resultados

```
Usuário → /resultados
  ↓
GET /api/resultados
  ↓
Busca Reports com Meeting, Client, Closer
  ↓
Exibe tabela com:
  - Closer
  - Filename
  - Call Date/Time
  - Client
  - Overall Score
  ↓
Ações:
  - Editar → Modal → PUT /api/meetings/:id
  - Excluir → DELETE /api/reports/:id
```

### 3. Fluxo de Dashboards

```
Usuário → /dashboards
  ↓
Aplica filtros (Closer, Cliente, Período)
  ↓
GET /api/dashboard/stats?closerId=...&startDate=...&endDate=...
  ↓
app/api/dashboard/stats/route.ts:
  - Busca Reports com filtros
  - Agrega dados (médias, contagens)
  - Normaliza nomes de critérios
  - Calcula KPIs
  - Prepara dados para gráficos
  ↓
Exibe:
  - KPIs (média geral, total relatórios, closers ativos)
  - Ranking de Closers (interativo)
  - Evolução Mensal (linha)
  - Distribuição por Critério (radar)
  - Heatmap Closer x Critério
```

---

## 🎨 Componentes Principais

### SidebarLayout
- **Localização**: `components/SidebarLayout.tsx`
- **Função**: Layout principal com sidebar colapsável e navegação modular
- **Módulos**: 
  - Agente Comercial (Análise, Resultados, Dashboards, Configurações)
  - Criador de Proposta (Criar Proposta, Minhas Propostas, Configurações)
- **Features**: Logo, navegação hierárquica, responsivo, oculto na impressão

### CRUDTable
- **Localização**: `components/CRUDTable.tsx`
- **Função**: Tabela genérica para operações CRUD
- **Features**: Criar, Editar, Deletar, Ativar/Desativar, Modal integrado

### Modal
- **Localização**: `components/Modal.tsx`
- **Função**: Modal genérico com tamanhos configuráveis
- **Tamanhos**: sm, md, lg, xl, full

---

## 🔌 API Endpoints Detalhados

### Análise
- **POST** `/api/analyze`
  - Body: `{ clientId, closerId, transcript }`
  - Retorna: `{ success, report }`

### Relatórios
- **GET** `/api/reports` - Lista relatórios (com filtros opcionais)
- **GET** `/api/reports/:id` - Busca relatório específico
- **DELETE** `/api/reports/:id` - Deleta relatório

### Resultados
- **GET** `/api/resultados` - Lista processada para página de resultados

### Reuniões
- **GET** `/api/meetings/:id` - Busca reunião
- **PUT** `/api/meetings/:id` - Atualiza reunião (clientId, closerId, createdAt)

### CRUD - Closers
- **GET** `/api/closers` - Lista closers
- **POST** `/api/closers` - Cria closer
- **GET** `/api/closers/:id` - Busca closer
- **PUT** `/api/closers/:id` - Atualiza closer
- **DELETE** `/api/closers/:id` - Deleta closer

### CRUD - Clientes
- **GET** `/api/clients` - Lista clientes
- **POST** `/api/clients` - Cria cliente
- **GET** `/api/clients/:id` - Busca cliente
- **PUT** `/api/clients/:id` - Atualiza cliente
- **DELETE** `/api/clients/:id` - Deleta cliente

### CRUD - Critérios
- **GET** `/api/criteria` - Lista critérios
- **POST** `/api/criteria` - Cria critério
- **GET** `/api/criteria/:id` - Busca critério
- **PUT** `/api/criteria/:id` - Atualiza critério
- **DELETE** `/api/criteria/:id` - Deleta critério

### Configurações
- **GET** `/api/prompt-templates` - Lista templates
- **POST** `/api/prompt-templates` - Cria template
- **GET** `/api/prompt-templates/:id` - Busca template
- **PUT** `/api/prompt-templates/:id` - Atualiza template
- **DELETE** `/api/prompt-templates/:id` - Deleta template

- **GET** `/api/model-config` - Lista configurações
- **POST** `/api/model-config` - Cria configuração
- **PUT** `/api/model-config/:id` - Atualiza configuração

### Dashboard
- **GET** `/api/dashboard/stats`
  - Query params: `closerId`, `clientId`, `startDate`, `endDate`
  - Retorna: KPIs, rankings, evolução mensal, distribuição, heatmap

---

## 🎯 Funcionalidades por Módulo

### Módulo: Agente Comercial

#### 1. Análise (`/`)
- Upload de arquivo .txt ou colagem de transcrição
- Seleção de cliente e closer
- Processamento com análise via ChatGPT
- Redirecionamento para relatório

#### 2. Resultados (`/resultados`)
- Lista de relatórios processados
- Colunas: Closer, Filename, Call Date/Time, Client, Overall Score
- Ações: Editar (modal) e Excluir
- Filtros visuais por nota (verde ≥70, amarelo 50-70, vermelho <50)

#### 3. Dashboards (`/dashboards`)
- **KPIs**: Média geral, Total de relatórios, Closers ativos
- **Ranking de Closers**: Gráfico de barras interativo (clique filtra)
- **Evolução Mensal**: Gráfico de linha com média geral
- **Distribuição por Critério**: Gráfico radar
- **Heatmap**: Tabela Closer x Critério (médias)
- Filtros: Closer, Cliente, Período
- Exportação PDF

#### 4. Configurações (`/configuracoes`)
- **Tab Closers**: CRUD completo
- **Tab Clientes**: CRUD completo (com telefone e lead name)
- **Tab Critérios**: CRUD com peso, exemplos, regras
- **Tab Model/Parâmetros**: Modelo, Reasoning Effort, Verbosity, Temperature, Top P, Max Tokens
- **Tab Prompt Template**: Editor com versionamento e histórico

### Módulo: Criador de Proposta

#### 1. Criar Proposta (`/propostas`)
- (Em desenvolvimento)

#### 2. Minhas Propostas (`/propostas/lista`)
- (Em desenvolvimento)

#### 3. Configurações (`/propostas/configuracoes`)
- **Tab Model/Parâmetros**: Configuração específica do módulo
- **Tab Prompt Template**: Templates filtrados por "proposta" ou "proposal"

---

## 📊 Visualizações e Gráficos

### Recharts Components Utilizados

1. **RadarChart**: Análise por Critério (relatório e dashboard)
2. **BarChart**: Notas por Critério (relatório), Ranking de Closers (dashboard)
3. **LineChart**: Evolução Mensal (dashboard)

### Customizações

- **Cores Dinâmicas**: Barras coloridas por score (vermelho 0-50, amarelo 50-70, verde >70)
- **Labels**: Valores exibidos nas barras
- **Tooltips**: Customizados com informações detalhadas
- **Interatividade**: Clique em barras do ranking filtra outros dados
- **Print Styles**: Otimizado para PDF com `@media print`

---

## 🔐 Segurança e Validação

### Validação com Zod
- Todos os endpoints validam entrada com schemas Zod
- Schemas definidos em `lib/validations.ts`
- Validação de tipos, formatos e valores obrigatórios

### Tratamento de Erros
- Try/catch em todos os endpoints
- Mensagens de erro específicas
- Logs no servidor para debugging

---

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção (gera Prisma Client + build Next.js)
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
npm run db:push      # Sincroniza schema Prisma com banco
npm run db:seed      # Popula banco com dados iniciais
npm run db:studio    # Abre Prisma Studio (GUI do banco)
```

---

## 📝 Variáveis de Ambiente

Arquivo `.env`:

```env
DATABASE_URL="file:./dev.db"           # SQLite (dev) ou PostgreSQL (prod)
OPENAI_API_KEY="sk-..."                 # Chave da API OpenAI
```

---

## 🐛 Troubleshooting Comum

### Erro: "Nenhum prompt template ativo encontrado"
**Solução**: Execute `npm run db:seed`

### Erro: "OPENAI_API_KEY não encontrada"
**Solução**: Verifique se `.env` existe e contém a chave correta

### Erro: Prisma Client desatualizado
**Solução**: Execute `npx prisma generate`

### Erro: Banco de dados não inicializado
**Solução**: Execute `npx prisma db push && npm run db:seed`

---

## 🔮 Melhorias Futuras

1. **Módulo Criador de Proposta**: Implementação completa
2. **Autenticação**: Sistema de login e permissões
3. **Notificações**: Alertas para novos relatórios
4. **Exportação Avançada**: Excel, CSV
5. **API Externa**: Documentação Swagger/OpenAPI
6. **Testes**: Unitários e E2E
7. **Cache**: Otimização de queries frequentes
8. **Webhooks**: Integração com outros sistemas

---

## 📚 Referências

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev/)

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0.0
