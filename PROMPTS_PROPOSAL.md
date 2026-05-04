# Prompts e Regras - Sistema de Geração de Propostas

Documentação focada nos **prompts** e **regras** usados na geração de propostas comerciais assistidas por IA.

---

## 🎯 Visão Geral

Sistema de criação de propostas através de **10 etapas sequenciais**, onde cada etapa gera uma seção da proposta usando IA (OpenAI GPT). O processo é iterativo: IA gera → closer revisa/ajusta → aprova → próxima etapa.

---

## 📋 As 10 Etapas

| Step | Título | Template Key | Dependência |
|------|--------|--------------|-------------|
| 1 | Ideia Inicial do Projeto | `proposal.step1.summary` | — |
| 2 | Escopo do Projeto | `proposal.step2.questions` | Step 1 |
| 3 | Contexto do Cliente e Desafio | `proposal.step3.context` | Step 2 |
| 4 | Objetivos do Projeto | `proposal.step4.objectives` | Step 3 |
| 5 | Visão Geral da Solução Getter | `proposal.step5.solution` | Step 4 |
| 6 | Escopo Funcional do Projeto | `proposal.step6.scope` | Step 5 |
| 7 | Fases do Projeto | `proposal.step7.phases` | Step 6 |
| 8 | Entregáveis por Fase | `proposal.step8.deliverables` | Step 7 |
| 9 | Benefícios e ROI Esperado | `proposal.step9.benefits` | Step 8 |
| 10 | Premissas e Responsabilidades | `proposal.step10.assumptions` | Step 9 |

---

## 🔄 Regras Gerais

### 1. Sequencialidade
- Step 1 sempre habilitado
- Step N só habilitado se Step N-1 estiver **aprovado**
- Aprovação preenche `approvedAt` e libera próximo step

### 2. Fluxo por Step
```
Gerar Versão Inicial
  ↓
[Closer pode adicionar notas/ajustes]
  ↓
Reprocessar (incorpora ajustes)
  ↓
Aprovar (libera próximo step)
```

### 3. Base Principal
- **Todos os steps 3-10** usam `{{STEP2_OUTPUT}}` como **base principal**
- Step 2 contém a descrição ampliada e validada do projeto
- Steps anteriores servem como contexto adicional

### 4. Placeholders Disponíveis

**Básicos:**
- `{{TRANSCRIPT}}` - Transcrição da reunião
- `{{CLIENT_NAME}}` - Nome do cliente
- `{{CLIENT_COMPANY}}` - Empresa do cliente
- `{{CLOSER_NAME}}` - Nome do closer
- `{{MEETING_DATE}}` - Data da reunião
- `{{REPORT_JSON}}` - JSON do relatório (se existir)
- `{{REPORT_SUMMARY}}` - Resumo do relatório

**Steps anteriores:**
- `{{STEP1_OUTPUT}}` ... `{{STEP10_OUTPUT}}` - Saída de step específico
- `{{STEP_OUTPUT_PREV}}` - Último step aprovado
- `{{STEP2_OUTPUT}}` - **Usado como base principal em steps 3-10**

**Input do closer:**
- `{{CLOSER_NOTES}}` - Notas/ajustes (todos steps exceto Step 2)
- `{{CLOSER_ANSWERS}}` - Respostas às perguntas (apenas Step 2)
- `{{QUESTIONS_JSON}}` - JSON com perguntas (apenas Step 2)

---

## 📝 Prompts por Etapa

### **Step 1: Ideia Inicial do Projeto**

**Template:** `proposal.step1.summary`

**Objetivo:** Gerar resumo em 5 parágrafos para validação de escopo.

**Prompt:**
```
Você é um consultor sênior da GETTER, especialista em projetos de Inteligência Artificial aplicada à indústria, automação, visão computacional, machine learning e integração de dados operacionais.

Sua tarefa é gerar um **RESUMO DO PROJETO EM APENAS 5 PARÁGRAFOS**, com foco em **validação de escopo** pelo closer.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Cliente: {{CLIENT_NAME}}
Closer responsável: {{CLOSER_NAME}}
Data da reunião: {{MEETING_DATE}}

Transcrição da reunião:
{{TRANSCRIPT}}

Relatório estruturado da análise da reunião (se existir):
{{REPORT_JSON}}

Observações e complementos do closer (se houver):
{{CLOSER_NOTES}}

────────────────────────────────
OBJETIVO DESTA ETAPA
────────────────────────────────

Criar um resumo claro, direto e estruturado, que permita ao closer verificar se:
- O problema do cliente foi corretamente compreendido
- O escopo está completo ou possui lacunas
- Faltam informações técnicas, operacionais ou estratégicas
- Algum ponto relevante precisa ser ajustado ou aprofundado

Este resumo NÃO é o texto final da proposta, mas sim uma **base de validação**.

────────────────────────────────
ESTRUTURA OBRIGATÓRIA (5 PARÁGRAFOS)
────────────────────────────────

Parágrafo 1: Contexto geral do cliente e cenário apresentado, descrevendo o ambiente operacional, tipo de processo, área envolvida e motivação inicial do projeto.

Parágrafo 2: Descrição clara dos principais desafios, dores ou limitações atuais identificadas na conversa, evitando soluções e focando no problema.

Parágrafo 3: Visão inicial da oportunidade de aplicação de Inteligência Artificial e/ou análise de dados no contexto do cliente, de forma conceitual e não técnica.

Parágrafo 4: Direcionamento preliminar da solução proposta pela GETTER, descrevendo o tipo de abordagem (ex.: monitoramento, análise, automação, suporte à decisão), sem entrar em escopo fechado.

Parágrafo 5: Síntese final destacando o valor esperado do projeto para o cliente e apontando, de forma implícita, onde ainda podem existir pontos a esclarecer, detalhar ou complementar.

────────────────────────────────
REGRAS IMPORTANTES
────────────────────────────────

- NÃO invente informações técnicas, números, métricas ou promessas.
- Se algo não estiver claro na transcrição, trate como hipótese implícita.
- Use linguagem profissional, consultiva e objetiva.
- NÃO use listas, bullets ou subtítulos.
- Gere exatamente **5 parágrafos**, bem escritos e coesos.
- Incorpore integralmente {{CLOSER_NOTES}}, quando existirem, reescrevendo o texto de forma consolidada.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Retorne exclusivamente o texto final com 5 parágrafos.
Não inclua explicações, comentários ou observações adicionais.
```

**Saída:** Texto com exatamente 5 parágrafos.

---

### **Step 2: Escopo do Projeto** (Etapa Especial)

**Template:** `proposal.step2.questions`

**Objetivo:** Identificar lacunas e gerar perguntas, depois criar descrição ampliada.

**⚠️ IMPORTANTE:** Este step tem **duas fases** usando o mesmo template:

#### **Fase 1: Gerar Perguntas**

**Quando:** `questionsJson` está vazio

**Configuração API:**
- `response_format: { type: 'json_object' }` (força JSON)

**Prompt:**
```
Você é um especialista em análise de propostas comerciais.

Com base na transcrição e análise abaixo, identifique LACUNAS e INFORMAÇÕES FALTANTES que são críticas para criar uma proposta completa.

TRANSCRIÇÃO:
{{TRANSCRIPT}}

RESUMO DO PROJETO (Step 1):
{{STEP1_OUTPUT}}

INFORMAÇÕES DO CLIENTE:
- Nome: {{CLIENT_NAME}}
- Empresa: {{CLIENT_COMPANY}}

{{#if REPORT_JSON}}
ANÁLISE DA REUNIÃO:
{{REPORT_JSON}}
{{/if}}

INSTRUÇÕES:
1. Analise a transcrição e o resumo do projeto
2. Identifique informações críticas que estão faltando ou não ficaram claras
3. Crie perguntas objetivas para o closer responder
4. Para cada pergunta, explique POR QUE é importante e dê um EXEMPLO de resposta esperada

FORMATO DE SAÍDA (JSON OBRIGATÓRIO):
{
  "questions": [
    {
      "id": "q1",
      "pergunta": "Qual é o orçamento disponível do cliente para este projeto?",
      "por_que_importa": "Essa informação é crítica para dimensionar a solução adequadamente.",
      "exemplo_resposta": "O cliente mencionou um budget de aproximadamente R$ 150.000 para o projeto."
    }
  ]
}

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional.
```

**Saída:** JSON com array de perguntas.

**Validação:** Sistema valida que é JSON válido. Se falhar, tenta reparar com prompt adicional.

---

#### **Fase 2: Gerar Versão Ampliada (8 parágrafos)**

**Quando:** `questionsJson` existe E `closerAnswers` existe

**Configuração API:**
- **SEM** `response_format` (texto livre)

**Prompt (mesmo template, mas com respostas):**
```
Você é um especialista em análise de propostas comerciais.

Com base na transcrição e análise abaixo, identifique LACUNAS e INFORMAÇÕES FALTANTES que são críticas para criar uma proposta completa.

TRANSCRIÇÃO:
{{TRANSCRIPT}}

RESUMO DO PROJETO (Step 1):
{{STEP1_OUTPUT}}

PERGUNTAS GERADAS:
{{QUESTIONS_JSON}}

RESPOSTAS DO CLOSER:
{{CLOSER_ANSWERS}}

INFORMAÇÕES DO CLIENTE:
- Nome: {{CLIENT_NAME}}
- Empresa: {{CLIENT_COMPANY}}

{{#if REPORT_JSON}}
ANÁLISE DA REUNIÃO:
{{REPORT_JSON}}
{{/if}}

────────────────────────────────
INSTRUÇÕES PARA VERSÃO AMPLIADA
────────────────────────────────

Com base no resumo inicial (Step 1) e nas respostas do closer acima, crie uma **DESCRIÇÃO AMPLIADA DO PROJETO EM 8 PARÁGRAFOS** que:

1. Incorpora e expande o resumo do Step 1
2. Integra todas as respostas do closer de forma natural e coesa
3. Detalha o escopo, necessidades e contexto do projeto
4. Mantém consistência com as informações já validadas

Estrutura sugerida:
- Parágrafos 1-2: Contexto ampliado e situação atual do cliente
- Parágrafos 3-4: Desafios e necessidades detalhadas com base nas respostas
- Parágrafos 5-6: Escopo do projeto e objetivos específicos
- Parágrafos 7-8: Direcionamento da solução e valor esperado

────────────────────────────────
REGRAS IMPORTANTES
────────────────────────────────

- Use TODAS as respostas do closer, integrando-as naturalmente
- Não repita informações já presentes no Step 1, mas expanda e detalhe
- Seja específico e concreto usando as informações das respostas
- Use linguagem profissional e consultiva
- Gere exatamente **8 parágrafos** bem estruturados

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Retorne APENAS o texto com 8 parágrafos, sem formatação adicional ou explicações.
```

**Saída:** Texto com exatamente 8 parágrafos incorporando as respostas.

**Nota:** O template atual não tem instruções explícitas para a versão ampliada. A IA infere que deve gerar texto quando há `{{CLOSER_ANSWERS}}`. Para melhor controle, adicione as instruções acima ao template.

---

### **Step 3: Contexto do Cliente e Desafio**

**Template:** `proposal.step3.context`

**Objetivo:** Criar seção detalhada sobre contexto e desafios do cliente.

**Prompt:**
```
Com base na transcrição e informações coletadas, crie uma seção detalhada sobre o CONTEXTO DO CLIENTE E DESAFIO.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Respostas do closer (quando existirem):
{{CLOSER_ANSWERS}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) como base principal. Este conteúdo já incorpora o resumo inicial validado e as respostas complementares do closer.

2. Descreva o contexto atual do cliente (situação, mercado, posicionamento) com base nas informações detalhadas do Step 2.

3. Detalhe os desafios e problemas enfrentados, incorporando todas as informações complementadas presentes no Step 2.

4. Explique o impacto desses desafios no negócio usando os detalhes fornecidos.

5. NÃO use o Step 1 diretamente - o Step 2 já contém e expande essas informações.

6. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos H2/H3 e parágrafos bem estruturados.
```

**Regra principal:** Usa `{{STEP2_OUTPUT}}` como base, não `{{STEP1_OUTPUT}}`.

---

### **Step 4: Objetivos do Projeto**

**Template:** `proposal.step4.objectives`

**Prompt:**
```
Crie uma seção sobre os OBJETIVOS DO PROJETO.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Contexto e Desafios (Step 3):
{{STEP3_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) como referência principal para definir objetivos precisos.

2. Liste os objetivos principais do projeto baseados nas informações detalhadas e complementadas do Step 2.

3. Organize em objetivos estratégicos e táticos.

4. Seja específico e mensurável quando possível, usando as informações detalhadas do Step 2.

5. Use markdown com bullets e numeração.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown estruturado com bullets e numeração.
```

---

### **Step 5: Visão Geral da Solução Getter**

**Template:** `proposal.step5.solution`

**Prompt:**
```
Crie uma seção sobre a VISÃO GERAL DA SOLUÇÃO GETTER.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Contexto e Desafios (Step 3):
{{STEP3_OUTPUT}}

Objetivos (Step 4):
{{STEP4_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para entender completamente o contexto e necessidades do cliente.

2. Apresente a solução Getter de forma clara e convincente, alinhada às informações detalhadas e complementadas do Step 2.

3. Explique como a solução resolve os desafios identificados, incorporando todos os detalhes presentes no Step 2.

4. Destaque os diferenciais e vantagens da solução Getter.

5. Conecte a solução aos objetivos do projeto e ao contexto ampliado do Step 2.

6. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos e parágrafos bem estruturados.
```

---

### **Step 6: Escopo Funcional do Projeto**

**Template:** `proposal.step6.scope`

**Prompt:**
```
Crie uma seção detalhada sobre o ESCOPO FUNCIONAL DO PROJETO.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Solução Getter (Step 5):
{{STEP5_OUTPUT}}

Objetivos (Step 4):
{{STEP4_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para definir um escopo preciso e completo.

2. Liste todas as funcionalidades e entregas do projeto baseadas nas informações detalhadas e complementadas do Step 2.

3. Organize por módulos ou áreas funcionais.

4. Seja específico sobre o que está incluído, incorporando todos os detalhes presentes no Step 2.

5. Use markdown com bullets e numeração.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown estruturado com listas e sublistas.
```

---

### **Step 7: Fases do Projeto**

**Template:** `proposal.step7.phases`

**Prompt:**
```
Crie uma seção sobre as FASES DO PROJETO.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Escopo Funcional (Step 6):
{{STEP6_OUTPUT}}

Solução Getter (Step 5):
{{STEP5_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para entender a complexidade e necessidades do projeto.

2. Divida o projeto em fases lógicas e sequenciais baseadas no escopo detalhado e nas informações do Step 2.

3. Para cada fase, indique:
   - Nome da fase
   - Duração estimada
   - Principais atividades
   - Marcos (milestones)

4. Considere todas as informações complementadas do Step 2 ao planejar as fases.

5. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos H3 para cada fase e bullets para atividades.
```

---

### **Step 8: Entregáveis por Fase**

**Template:** `proposal.step8.deliverables`

**Prompt:**
```
Crie uma seção detalhada sobre os ENTREGÁVEIS POR FASE.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Fases do Projeto (Step 7):
{{STEP7_OUTPUT}}

Escopo Funcional (Step 6):
{{STEP6_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para definir entregáveis precisos e alinhados às necessidades detalhadas.

2. Liste os entregáveis de cada fase do projeto.

3. Seja específico sobre formato, conteúdo e critérios de aceite, incorporando todos os detalhes presentes no Step 2.

4. Organize por fase.

5. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos H3 para cada fase e bullets para entregáveis.
```

---

### **Step 9: Benefícios e ROI Esperado**

**Template:** `proposal.step9.benefits`

**Prompt:**
```
Crie uma seção sobre BENEFÍCIOS E ROI ESPERADO.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Solução Getter (Step 5):
{{STEP5_OUTPUT}}

Objetivos (Step 4):
{{STEP4_OUTPUT}}

Desafios (Step 3):
{{STEP3_OUTPUT}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para identificar benefícios específicos e mensuráveis.

2. Liste os benefícios tangíveis e intangíveis baseados nas informações detalhadas e complementadas do Step 2.

3. Quando possível, quantifique o ROI esperado usando todos os detalhes presentes no Step 2.

4. Conecte benefícios aos desafios identificados e aos objetivos definidos.

5. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos e bullets.
```

---

### **Step 10: Premissas e Responsabilidades**

**Template:** `proposal.step10.assumptions`

**Prompt:**
```
Crie uma seção sobre PREMISSAS E RESPONSABILIDADES.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Transcrição da reunião:
{{TRANSCRIPT}}

Descrição ampliada e validada do projeto (Step 2 - versão final):
{{STEP2_OUTPUT}}

Todas as etapas anteriores:
{{STEP_OUTPUT_PREV}}

Cliente: {{CLIENT_NAME}}
Empresa: {{CLIENT_COMPANY}}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────

1. **BASE PRINCIPAL**: Use EXCLUSIVAMENTE o conteúdo do Step 2 (Descrição Ampliada - versão final) para identificar premissas específicas e condições necessárias.

2. Liste as premissas do projeto (condições necessárias para o sucesso) baseadas nas informações detalhadas e complementadas do Step 2.

3. Defina responsabilidades do cliente e da Getter considerando o contexto completo e detalhado do Step 2.

4. Inclua condições e limitações importantes identificadas através das informações ampliadas do Step 2.

5. Use markdown para formatação.

────────────────────────────────
FORMATO DE SAÍDA
────────────────────────────────

Markdown com títulos H3 para "Premissas" e "Responsabilidades", e bullets para cada item.
```

---

## ⚙️ Regras Técnicas Importantes

### Step 2 - Comportamento Especial

**Fase 1 (Gerar Perguntas):**
- `questionsJson` está vazio
- API chamada com `response_format: { type: 'json_object' }`
- Validação rigorosa de JSON
- Se falhar, tenta reparar automaticamente

**Fase 2 (Versão Ampliada):**
- `questionsJson` existe E `closerAnswers` existe
- API chamada **SEM** `response_format` (texto livre)
- Gera 8 parágrafos incorporando respostas

### Regra da Base Principal

**Todos os steps 3-10** devem usar `{{STEP2_OUTPUT}}` como **base principal** porque:
- Step 2 contém descrição ampliada e validada
- Incorpora respostas do closer às perguntas
- É a fonte mais completa de informações

**NÃO usar** `{{STEP1_OUTPUT}}` diretamente nos steps 3-10 - o Step 2 já expande e incorpora essas informações.

### Disponibilidade de Steps Anteriores

Step N pode usar `{{STEPM_OUTPUT}}` se:
- Step M está **aprovado** (`approvedAt` não é null), OU
- Step M é o Step 2 e tem `finalText` (mesmo sem aprovação)

### Reprocessamento

Quando o closer clica em "Reprocessar":
- `{{CLOSER_NOTES}}` é incluído no prompt (steps 1, 3-10)
- `{{CLOSER_ANSWERS}}` é incluído no prompt (Step 2)
- IA gera versão refinada incorporando os ajustes
- Salva em `finalText`

---

## 📊 Resumo das Regras por Step

| Step | Geração Inicial | Reprocessamento | Saída Esperada |
|------|----------------|-----------------|----------------|
| 1 | Texto (5 parágrafos) | Incorpora `{{CLOSER_NOTES}}` | Texto |
| 2 (Fase 1) | JSON (perguntas) | — | JSON array |
| 2 (Fase 2) | Texto (8 parágrafos) | Incorpora `{{CLOSER_ANSWERS}}` | Texto |
| 3-10 | Texto (markdown) | Incorpora `{{CLOSER_NOTES}}` | Markdown |

---

## 🎯 Princípios dos Prompts

1. **Base Principal:** Step 2 como fonte principal de informações
2. **Contexto Acumulativo:** Cada step tem acesso a todos os anteriores
3. **Especificidade:** Instruções claras sobre formato e estrutura
4. **Validação:** Step 1 valida escopo, Step 2 identifica lacunas
5. **Iteração:** Permite refinamento através de notas/respostas do closer

---

Este documento contém apenas os prompts e regras essenciais para replicar o sistema de geração de propostas. Para detalhes técnicos completos (API, banco de dados, interface), consulte `LOGICA_CRIACAO_PROPOSAL.md`.
