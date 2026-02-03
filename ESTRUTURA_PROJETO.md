# Estrutura do Projeto

## 📂 Organização de Arquivos

```
agente-comercial/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze/              # POST /api/analyze - Processa transcrição
│   │   ├── reports/              # GET /api/reports - Lista relatórios
│   │   │   └── [id]/             # GET /api/reports/:id - Relatório específico
│   │   ├── closers/              # CRUD de closers
│   │   ├── clients/              # CRUD de clientes
│   │   ├── criteria/            # CRUD de critérios
│   │   ├── prompt-templates/    # CRUD de templates
│   │   ├── model-config/         # Configuração do modelo
│   │   └── dashboard/            # GET /api/dashboard/stats - Estatísticas
│   ├── configuracoes/            # Página de configurações
│   ├── dashboards/               # Página de dashboards
│   ├── relatorio/                # Página de visualização de relatórios
│   │   └── [id]/                 # Relatório específico
│   ├── page.tsx                  # Página principal (análise)
│   ├── layout.tsx                # Layout raiz
│   └── globals.css               # Estilos globais
│
├── components/                   # Componentes React reutilizáveis
│   ├── Layout.tsx                # Layout com navegação
│   ├── Button.tsx                # Botão reutilizável
│   ├── Input.tsx                 # Input reutilizável
│   ├── Select.tsx                # Select reutilizável
│   ├── Textarea.tsx              # Textarea reutilizável
│   ├── Modal.tsx                 # Modal reutilizável
│   └── CRUDTable.tsx             # Tabela CRUD genérica
│
├── lib/                          # Bibliotecas e utilitários
│   ├── prisma.ts                 # Cliente Prisma (singleton)
│   ├── openai.ts                 # Integração com OpenAI API
│   └── validations.ts            # Schemas Zod para validação
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema do banco de dados
│   └── seed.ts                   # Seed com dados iniciais
│
├── .env.example                  # Exemplo de variáveis de ambiente
├── .gitignore                    # Arquivos ignorados pelo git
├── package.json                  # Dependências do projeto
├── tsconfig.json                 # Configuração TypeScript
├── tailwind.config.ts            # Configuração Tailwind
├── next.config.js                # Configuração Next.js
├── README.md                     # Documentação principal
├── QUICK_START.md                # Guia rápido
└── EXEMPLO_TRANSCRICAO.txt       # Exemplo de transcrição
```

## 🔄 Fluxo de Dados

### Processamento de Transcrição

1. **Frontend** (`app/page.tsx`)
   - Usuário preenche: cliente, closer, transcrição
   - Envia POST para `/api/analyze`

2. **API** (`app/api/analyze/route.ts`)
   - Valida dados com Zod
   - Busca cliente e closer no banco
   - Chama `analyzeTranscript()` do `lib/openai.ts`

3. **OpenAI Integration** (`lib/openai.ts`)
   - Busca critérios ativos e prompt template
   - Monta prompt com placeholders
   - Chama API do OpenAI
   - Valida resposta com Zod
   - Retorna análise estruturada

4. **Persistência**
   - Cria `Meeting` no banco
   - Cria `Report` com os resultados
   - Retorna relatório completo

5. **Visualização** (`app/relatorio/[id]/page.tsx`)
   - Busca relatório do banco
   - Renderiza gráficos, notas, insights

## 🗄️ Modelos de Dados

### Closer
- id, name, email, active, createdAt, updatedAt

### Client
- id, name, email, company, active, createdAt, updatedAt

### Criterion
- id, name, description, weight, examples (JSON), rules (JSON), goodExamples, badExamples, active

### PromptTemplate
- id, name, content, active, version, history (JSON), createdAt, updatedAt

### Meeting
- id, clientId, closerId, transcript, createdAt, updatedAt

### Report
- id, meetingId, overallScore, criteriaScores (JSON), insights (JSON), rawModelOutput (JSON)

### ModelConfig
- id, model, temperature, topP, maxTokens, active

## 🔌 Integrações

### OpenAI API
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Modelo padrão: `gpt-4-turbo-preview`
- Formato de resposta: JSON estrito
- Validação: Zod schemas

## 📊 Visualizações

### Gráficos (Recharts)
- **Radar Chart**: Análise por critério
- **Bar Chart**: Notas por critério / Ranking
- **Line Chart**: Evolução mensal
- **Heatmap**: Closer x Critério (tabela com cores)

## 🎨 UI/UX

### Design System
- **Cores**: Tailwind CSS padrão
- **Componentes**: Reutilizáveis e acessíveis
- **Layout**: Responsivo (mobile-first)
- **Navegação**: Tabs e breadcrumbs

### Estados
- Loading states em todas as operações assíncronas
- Error handling com mensagens claras
- Empty states quando não há dados