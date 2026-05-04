# Agente Comercial - Análise de Transcrições de Reuniões de Vendas

Sistema completo para análise automatizada de transcrições de reuniões de vendas usando inteligência artificial (API do OpenAI/ChatGPT). A aplicação permite processar transcrições, avaliar o desempenho de closers (vendedores) em múltiplos critérios, gerar relatórios detalhados com gráficos e visualizações, e fornecer dashboards interativos com métricas e KPIs para gestão comercial.

## 🚀 Funcionalidades

### Módulo: Agente Comercial

#### Análise de Transcrição (`/`)
- Upload de arquivo .txt ou colagem de transcrição
- Seleção de cliente e closer
- Processamento com análise via OpenAI API
- Visualização de relatórios com:
  - Informações da reunião (Closer, Cliente, Data)
  - Nota geral (0-100)
  - Resumo executivo
  - Análise detalhada por critério
  - Gráficos interativos (radar e barras)
  - Plano de ação priorizado
  - Compromissos (ações do closer e do lead)
  - Metadados e insights
  - Exportação em PDF e JSON

#### Resultados (`/resultados`)
- Lista de todas as análises processadas
- Colunas: Closer, Nome do Arquivo, Data/Hora da Call, Cliente, Nota
- Ações disponíveis:
  - **Ver Transcrição**: Visualizar transcrição completa em modal
  - **Gerar Proposta**: Navegar para criação de proposta com dados pré-preenchidos
  - **Editar**: Editar dados da reunião (closer, cliente, data/hora)
  - **Ver Detalhes**: Visualizar relatório completo
  - **Excluir**: Remover resultado
- Filtros visuais por nota (verde ≥70, amarelo 50-70, vermelho <50)

#### Dashboards (`/dashboards`)
- **KPIs**:
  - Total de Relatórios
  - Média Geral
  - Maior Nota
  - Desvio Padrão
  - Closers Ativos
- **Ranking de Closers**: Gráfico de barras interativo (clique filtra dados)
- **Evolução Mensal**: Gráfico de linha com média geral ao longo do tempo
- **Distribuição por Critério**: Gráfico radar
- **Heatmap**: Tabela Closer x Critério (médias)
- Filtros: Closer, Cliente, Período (Data Início/Fim)
- Exportação em PDF

#### Configurações (`/configuracoes`)
- **Closers**: CRUD completo (criar, editar, ativar/desativar)
- **Clientes**: CRUD completo (com telefone e nome do lead)
- **Critérios**: CRUD com configuração de peso, exemplos, regras
- **Prompt Template**: Editor com versionamento e histórico
- **Model/Parâmetros**: Configuração de modelo, reasoning effort, verbosity, temperature, top_p, max_tokens

### Configurações
- **Closers**: CRUD completo (criar, editar, ativar/desativar)
- **Clientes**: CRUD completo
- **Critérios**: CRUD com configuração de peso, exemplos, regras
- **Prompt Template**: Editor com versionamento e histórico
- **Model/Parâmetros**: Configuração de modelo, temperature, top_p, max_tokens

### Módulo: Criador de Proposta

#### Criar Proposta (`/propostas`)
- Interface para criação de propostas comerciais (em desenvolvimento)
- Suporte a dados pré-preenchidos a partir de reuniões analisadas

#### Minhas Propostas (`/propostas/lista`)
- Lista de propostas criadas (em desenvolvimento)

#### Configurações (`/propostas/configuracoes`)
- **Model/Parâmetros**: Configuração específica do módulo
- **Prompt Template**: Templates filtrados por "proposta" ou "proposal"

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta OpenAI com API key

## 🛠️ Instalação

1. **Clone o repositório** (ou navegue até a pasta do projeto)

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da API do OpenAI:
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sua-chave-aqui"
```

4. **Configure o banco de dados:**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
├── app/
│   ├── api/                      # Rotas da API (Backend)
│   │   ├── analyze/              # POST /api/analyze - Processa transcrição
│   │   ├── reports/              # GET/DELETE /api/reports/:id
│   │   ├── resultados/           # GET /api/resultados - Lista processada
│   │   ├── meetings/             # GET/PUT /api/meetings/:id
│   │   ├── closers/              # CRUD de closers
│   │   ├── clients/              # CRUD de clientes
│   │   ├── criteria/             # CRUD de critérios
│   │   ├── prompt-templates/     # CRUD de templates
│   │   ├── model-config/         # Configuração do modelo
│   │   └── dashboard/stats/     # GET /api/dashboard/stats - KPIs e métricas
│   ├── configuracoes/            # Configurações - Agente Comercial
│   ├── dashboards/               # Dashboards com KPIs e gráficos
│   ├── resultados/               # Lista de resultados com ações
│   ├── relatorio/[id]/          # Visualização de relatório individual
│   ├── propostas/                # Módulo Criador de Proposta
│   │   ├── page.tsx              # Criar Proposta
│   │   ├── lista/                # Minhas Propostas
│   │   └── configuracoes/        # Configurações do módulo
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página principal: Análise
│   └── globals.css               # Estilos globais + @media print
├── components/                   # Componentes React reutilizáveis
│   ├── SidebarLayout.tsx         # Layout com sidebar modular
│   ├── CRUDTable.tsx             # Tabela CRUD genérica
│   ├── Modal.tsx                 # Modal genérico
│   ├── Button.tsx                # Botão estilizado
│   ├── Input.tsx                 # Input de texto
│   ├── Select.tsx                # Select dropdown
│   └── Textarea.tsx              # Textarea
├── lib/                          # Utilitários e helpers
│   ├── prisma.ts                 # Cliente Prisma (singleton)
│   ├── openai.ts                 # Integração OpenAI + construção de prompt
│   └── validations.ts            # Schemas Zod para validação
├── prisma/
│   ├── schema.prisma             # Schema do banco de dados
│   └── seed.ts                   # Seed com dados iniciais
└── README.md
```

## 🗄️ Banco de Dados

O projeto usa **SQLite** por padrão (para desenvolvimento) e pode ser facilmente migrado para **PostgreSQL** em produção.

### Migração para PostgreSQL

1. Altere o `provider` no `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Atualize a `DATABASE_URL` no `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/agente_comercial"
```

3. Execute as migrações:
```bash
npx prisma migrate dev
```

## 🔧 Configuração da API do OpenAI

1. Obtenha sua API key em: https://platform.openai.com/api-keys
2. Adicione no arquivo `.env`:
```
OPENAI_API_KEY="sk-..."
```

### Modelos Suportados
- `gpt-5.2` (padrão)
- `gpt-4-turbo-preview`
- `gpt-4`
- `gpt-3.5-turbo`

**Nota**: Modelos GPT-5 usam `max_completion_tokens` em vez de `max_tokens`. O sistema detecta automaticamente e ajusta os parâmetros.

Configure o modelo em **Configurações > Model/Parâmetros**.

## 📊 Critérios Padrão

O seed cria 8 critérios padrão:

1. **Abertura e Rapport** (Peso: 1.0)
2. **Descoberta (Perguntas e Profundidade)** (Peso: 1.2)
3. **Clareza do Problema e Dor** (Peso: 1.3)
4. **Proposta de Valor e Conexão com Dor** (Peso: 1.4)
5. **Condução e Controle da Call** (Peso: 1.1)
6. **Tratamento de Objeções** (Peso: 1.3)
7. **Próximos Passos e Fechamento** (Peso: 1.2)
8. **Comunicação (Clareza e Objetividade)** (Peso: 1.0)

Você pode editar, criar ou desativar critérios em **Configurações > Critérios**.

## 📝 Formato do Prompt Template

O prompt template suporta os seguintes placeholders:

- `{{CRITERIA_LIST}}` - Lista formatada de critérios (com ID, nome exato, peso, descrição, exemplos)
- `{{TRANSCRIPT}}` - Transcrição da reunião
- `{{CLIENT_NAME}}` - Nome do cliente
- `{{CLOSER_NAME}}` - Nome do closer

O sistema inclui instruções explícitas para:
- Usar IDs e nomes exatos dos critérios
- Extrair compromissos (ações do closer e do lead)
- Fornecer evidências e citações
- Gerar saída consistente e estruturada

Edite o template em **Configurações > Prompt Template**.

## 📤 Exportação

### Exportar Relatório

#### Exportar JSON
Clique em "Exportar JSON" na página do relatório. O arquivo contém todos os dados do relatório em formato JSON, incluindo:
- Informações da reunião
- Nota geral e critérios
- Insights, resumo e plano de ação
- Compromissos (ações do closer e do lead)
- Metadados e dados dos gráficos

#### Exportar PDF
Clique em "Exportar PDF" na página do relatório para abrir o diálogo de impressão do navegador. O PDF inclui:
- Primeira página: Nota geral, resumo, gráficos (Radar e Barras)
- Páginas seguintes: Análise detalhada por critério, plano de ação, compromissos, metadados
- Layout otimizado para impressão com fontes e espaçamentos ajustados

### Exportar Dashboard
Na página de Dashboards, clique em "Exportar PDF" para gerar um PDF com todos os KPIs, gráficos e tabelas. O layout é otimizado para impressão.

## 🔌 API Endpoints

### Análise
- `POST /api/analyze` - Processa uma transcrição
  ```json
  {
    "clientId": "string",
    "closerId": "string",
    "transcript": "string"
  }
  ```

### Relatórios
- `GET /api/reports` - Lista relatórios (com filtros opcionais)
- `GET /api/reports/:id` - Busca um relatório específico (inclui transcrição)
- `DELETE /api/reports/:id` - Deleta um relatório

### Resultados
- `GET /api/resultados` - Lista processada para página de resultados

### Reuniões
- `GET /api/meetings/:id` - Busca reunião (inclui transcrição)
- `PUT /api/meetings/:id` - Atualiza reunião (closer, cliente, data/hora)

### CRUD
- `GET/POST /api/closers` - Listar/Criar closers
- `GET/PUT/DELETE /api/closers/:id` - Buscar/Atualizar/Deletar closer
- `GET/POST /api/clients` - Listar/Criar clientes
- `GET/PUT/DELETE /api/clients/:id` - Buscar/Atualizar/Deletar cliente
- `GET/POST /api/criteria` - Listar/Criar critérios
- `GET/PUT/DELETE /api/criteria/:id` - Buscar/Atualizar/Deletar critério

### Configurações
- `GET/POST /api/prompt-templates` - Templates de prompt
- `GET/PUT/DELETE /api/prompt-templates/:id` - Gerenciar template
- `GET/POST /api/model-config` - Configuração do modelo
- `PUT /api/model-config/:id` - Atualizar configuração

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas e KPIs
  - Query params: `closerId`, `clientId`, `startDate`, `endDate`
  - Retorna: KPIs (total, média, maior nota, desvio padrão, closers ativos), ranking, evolução mensal, distribuição por critério, heatmap

## 🧪 Exemplo de Payload

### Request para /api/analyze
```json
{
  "clientId": "clxxx",
  "closerId": "clxxx",
  "transcript": "Closer: Olá! Como você está hoje?\nCliente: Bem, obrigado..."
}
```

### Response
```json
{
  "success": true,
  "report": {
    "id": "rep_xxx",
    "meetingId": "meet_xxx",
    "overallScore": 85.5,
    "criteria": [
      {
        "id": "crit_xxx",
        "name": "Abertura e Rapport",
        "score_0_10": 8.5,
        "weight": 1.0,
        "evidence_quotes": ["..."],
        "improvements": ["..."],
        "positives": ["..."]
      }
    ],
    "summary": "Resumo executivo...",
    "actionPlan": [...],
    "metadata": {...},
    "chartData": {...}
  }
}
```

## 🐛 Troubleshooting

### Erro: "Nenhum prompt template ativo encontrado"
Execute o seed novamente:
```bash
npm run db:seed
```

### Erro: "OPENAI_API_KEY não encontrada"
Verifique se o arquivo `.env` existe e contém a chave correta. O arquivo deve estar na raiz do projeto.

### Erro ao processar transcrição
- Verifique se a transcrição tem pelo menos 10 caracteres
- Verifique se o cliente e closer existem
- Verifique os logs do servidor para mais detalhes
- Para modelos GPT-5, verifique se `max_completion_tokens` está configurado (padrão: 8000)

### Erro: "Resposta vazia da API do OpenAI" com `finishReason: 'length'`
Aumente o valor de `max_completion_tokens` ou `max_tokens` nas configurações do modelo.

### Banco de dados não inicializado
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### Prisma Client desatualizado
Se houver erros relacionados ao schema do Prisma:
```bash
npx prisma generate
npx prisma db push
```

### Erro ao exportar PDF
- Use Chrome ou Edge para melhor compatibilidade
- Verifique se os pop-ups não estão bloqueados
- O PDF é gerado via `window.print()` do navegador

## 📚 Tecnologias Utilizadas

- **Next.js 14** (App Router) - Framework React com Server Components
- **TypeScript** - Tipagem estática em todo o projeto
- **Tailwind CSS** - Estilização utilitária e responsiva
- **Prisma ORM** - Gerenciamento de banco de dados (SQLite/PostgreSQL)
- **Zod** - Validação de schemas em runtime
- **OpenAI API** - Análise com GPT-4/GPT-5
- **Recharts** - Gráficos e visualizações (RadarChart, BarChart, LineChart)
- **date-fns** - Formatação de datas
- **Radix UI** - Componentes acessíveis (Dialog, Select, Tabs)

## 📄 Licença

Este projeto é de uso interno.

## 🤝 Contribuindo

Para contribuir:
1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request

## 📖 Documentação Adicional

- **PROMPTS_PROPOSAL.md**: Prompts e regras da geração de propostas (foco em prompts e regras)
- **LOGICA_CRIACAO_PROPOSAL.md**: Lógica completa e prompts usados na criação de propostas (documentação técnica completa)
- **PADRAO_VISUAL_ARQUITETURA.md**: Padrão visual e arquitetura do projeto (para replicar em outros projetos)
- **DOCKER.md**: Como rodar o projeto com Docker
- **GITHUB_SETUP.md**: Como manter o projeto no GitHub e clonar em outro computador
- **MIGRACAO_AMBIENTE.md**: Como rodar a aplicação em outro computador (migração de ambiente local)
- **DOCUMENTACAO_PROJETO.md**: Documentação completa e detalhada do projeto
- **ESTRUTURA_ARQUIVOS.md**: Estrutura visual completa de arquivos e diretórios
- **QUICK_START.md**: Guia rápido de início (se disponível)

## 🎯 Funcionalidades Recentes

### Versão Atual
- ✅ Métricas adicionais no Dashboard: Maior Nota e Desvio Padrão
- ✅ Ícones de ação na tela Resultados: Ver Transcrição e Gerar Proposta
- ✅ Modal para visualização de transcrições
- ✅ Exportação de PDF dos Dashboards
- ✅ Gráfico de Ranking interativo (clique filtra dados)
- ✅ Seção de Compromissos nos relatórios (ações do closer e do lead)
- ✅ Normalização de nomes de critérios para agrupamento correto
- ✅ Suporte a modelos GPT-5 com `max_completion_tokens`
- ✅ Layout modular com sidebar (Agente Comercial / Criador de Proposta)

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa (`DOCUMENTACAO_PROJETO.md`) ou entre em contato com a equipe de desenvolvimento.