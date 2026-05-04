# Lógica e Prompts - Sistema de Criação de Propostas

Documentação completa da arquitetura, lógica e prompts usados no sistema de criação de propostas comerciais assistidas por IA.

---

## 📋 Visão Geral

O sistema cria propostas comerciais através de **10 etapas sequenciais** (steps), onde cada etapa gera um trecho da proposta usando IA (OpenAI GPT). O processo é **iterativo e colaborativo**: a IA gera conteúdo, o closer revisa/ajusta, e então aprova para liberar a próxima etapa.

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Dados

**Modelos principais:**
- `Proposal` - Proposta comercial (vinculada a uma reunião/meeting)
- `ProposalStep` - Cada etapa da proposta (10 steps no total)
- `PromptTemplate` - Templates de prompt para cada step (armazenados no banco)
- `Meeting` - Reunião que originou a proposta (contém transcrição, cliente, closer)
- `Report` - Análise da reunião (opcional, usado como contexto adicional)

**Campos importantes do `ProposalStep`:**
- `stepNumber` (1-10) - Número sequencial da etapa
- `stepKey` - Chave identificadora (ex: `proposal.step1.summary`)
- `initialText` - Texto inicial gerado pela IA
- `finalText` - Texto final após reprocessamento com ajustes do closer
- `questionsJson` - JSON com perguntas (apenas Step 2)
- `closerAnswers` - Respostas do closer às perguntas (apenas Step 2)
- `closerNotes` - Notas/ajustes do closer (todos os steps exceto Step 2)
- `approvedAt` - Data de aprovação (null = não aprovado)
- `approvedBy` - Quem aprovou (opcional)

### Fluxo de Trabalho

```
1. Criar Proposta
   ↓
2. Step 1: Gerar → Revisar → Aprovar
   ↓
3. Step 2: Gerar Perguntas → Responder → Gerar Versão Ampliada → Aprovar
   ↓
4. Step 3-10: Gerar → Revisar/Ajustar → Reprocessar → Aprovar
   ↓
5. Proposta Completa (todos os steps aprovados)
```

---

## 🔄 Lógica de Cada Etapa

### **Step 1: Ideia Inicial do Projeto**

**Objetivo:** Criar um resumo inicial em 5 parágrafos para validação de escopo pelo closer.

**Fluxo:**
1. Closer clica em "Gerar Versão Inicial"
2. Sistema busca template `proposal.step1.summary`
3. Substitui placeholders com contexto (transcrição, cliente, closer, relatório se houver)
4. Chama OpenAI API com o prompt
5. Salva resultado em `initialText`
6. Closer pode adicionar "Considerações do Closer" em `closerNotes`
7. Closer clica em "Reprocessar" → gera `finalText` incorporando as notas
8. Closer aprova → `approvedAt` é preenchido, Step 2 é liberado

**Prompt usado:** Template `proposal.step1.summary` (ver seção de prompts abaixo)

**Placeholders disponíveis:**
- `{{TRANSCRIPT}}` - Transcrição da reunião
- `{{CLIENT_NAME}}` - Nome do cliente
- `{{CLIENT_COMPANY}}` - Empresa do cliente
- `{{CLOSER_NAME}}` - Nome do closer
- `{{MEETING_DATE}}` - Data da reunião
- `{{REPORT_JSON}}` - JSON completo do relatório (se existir)
- `{{REPORT_SUMMARY}}` - Resumo do relatório
- `{{CLOSER_NOTES}}` - Notas do closer (vazio na primeira geração)

**Saída esperada:** Texto com exatamente 5 parágrafos bem estruturados.

---

### **Step 2: Escopo do Projeto** (Etapa Especial)

**Objetivo:** Identificar lacunas de informação e gerar perguntas para o closer responder, depois criar uma descrição ampliada do projeto.

**Fluxo em 2 fases:**

#### Fase 1: Gerar Perguntas
1. Closer clica em "Gerar Perguntas"
2. Sistema busca template `proposal.step2.questions`
3. Substitui placeholders (inclui `{{STEP1_OUTPUT}}` com o Step 1 aprovado)
4. Chama OpenAI API com `response_format: { type: 'json_object' }` (força JSON)
5. Valida que a resposta é um JSON válido com array de perguntas
6. Salva em `questionsJson`

**Estrutura esperada do JSON:**
```json
{
  "questions": [
    {
      "id": "q1",
      "pergunta": "Qual é o orçamento disponível?",
      "por_que_importa": "Essa informação é crítica para dimensionar a solução.",
      "exemplo_resposta": "O cliente mencionou um budget de R$ 150.000."
    }
  ]
}
```

#### Fase 2: Gerar Versão Ampliada (8 parágrafos)
1. Closer responde cada pergunta (salvas em `closerAnswers` como JSON)
2. Closer clica em "Gerar Versão Ampliada (8 parágrafos)"
3. Sistema usa o **mesmo template** `proposal.step2.questions`, mas agora:
   - `{{CLOSER_ANSWERS}}` está preenchido com as respostas
   - `{{QUESTIONS_JSON}}` contém as perguntas geradas
   - **NÃO** força JSON mode (permite texto livre)
4. Chama OpenAI API (sem `response_format`)
5. Gera texto em 8 parágrafos incorporando:
   - Resumo do Step 1
   - Respostas do closer às perguntas
   - Informações da transcrição
6. Salva em `finalText`
7. Closer pode aprovar (com ou sem versão ampliada)

**Prompt usado:** Template `proposal.step2.questions` (ver seção de prompts abaixo)

**Placeholders adicionais:**
- `{{STEP1_OUTPUT}}` - Saída do Step 1 aprovado
- `{{QUESTIONS_JSON}}` - JSON com as perguntas geradas
- `{{CLOSER_ANSWERS}}` - JSON com respostas do closer

**Comportamento especial:**
- Se `questionsJson` está vazio → gera perguntas (JSON mode)
- Se `questionsJson` existe e `closerAnswers` existe → gera versão ampliada (texto)

**Saída esperada:**
- Fase 1: JSON com array de perguntas
- Fase 2: Texto com 8 parágrafos detalhados sobre o escopo do projeto

---

### **Steps 3-10: Etapas Sequenciais**

**Objetivo:** Cada step gera uma seção específica da proposta usando os steps anteriores como contexto.

**Fluxo padrão:**
1. Step anterior deve estar aprovado para liberar o próximo
2. Closer clica em "Gerar Versão Inicial"
3. Sistema busca template correspondente (ex: `proposal.step3.context`)
4. Substitui placeholders incluindo:
   - `{{STEP2_OUTPUT}}` - Versão ampliada do Step 2 (ou perguntas se não houver versão ampliada)
   - `{{STEP_OUTPUT_PREV}}` - Último step aprovado
   - Steps específicos anteriores (`{{STEP1_OUTPUT}}`, `{{STEP3_OUTPUT}}`, etc.)
5. Chama OpenAI API
6. Salva em `initialText`
7. Closer pode adicionar "Considerações do Closer" em `closerNotes`
8. Closer clica em "Reprocessar" → gera `finalText` incorporando as notas
9. Closer aprova → próximo step é liberado

**Steps e seus templates:**

| Step | Key | Título | Dependência |
|------|-----|--------|-------------|
| 3 | `proposal.step3.context` | Contexto do Cliente e Desafio | Step 2 |
| 4 | `proposal.step4.objectives` | Objetivos do Projeto | Step 3 |
| 5 | `proposal.step5.solution` | Visão Geral da Solução Getter | Step 4 |
| 6 | `proposal.step6.scope` | Escopo Funcional do Projeto | Step 5 |
| 7 | `proposal.step7.phases` | Fases do Projeto | Step 6 |
| 8 | `proposal.step8.deliverables` | Entregáveis por Fase | Step 7 |
| 9 | `proposal.step9.benefits` | Benefícios e ROI Esperado | Step 8 |
| 10 | `proposal.step10.assumptions` | Premissas e Responsabilidades | Step 9 |

**Regra importante:** Todos os steps 3-10 usam `{{STEP2_OUTPUT}}` como **base principal**, pois o Step 2 contém a descrição ampliada e validada do projeto.

---

## 📝 Prompts Completos por Etapa

### **Step 1: Ideia Inicial do Projeto**

**Template Key:** `proposal.step1.summary`

**Prompt:**
```
Você é um consultor sênior da GETTER, especialista em projetos de Inteligência Artificial aplicada à indústria, automação, visão computacional, machine learning e integração de dados operacionais.

Sua tarefa é gerar um **RESUMO DO PROJETO EM APENAS 5 PARÁGRAFOS**, com foco em **validação de escopo** pelo closer.

────────────────────────────────
CONTEXTO DISPONÍVEL
────────────────────────────────

Cliente:
{{CLIENT_NAME}}

Closer responsável:
{{CLOSER_NAME}}

Data da reunião:
{{MEETING_DATE}}

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

Parágrafo 1  
Contexto geral do cliente e cenário apresentado, descrevendo o ambiente operacional, tipo de processo, área envolvida e motivação inicial do projeto.

Parágrafo 2  
Descrição clara dos principais desafios, dores ou limitações atuais identificadas na conversa, evitando soluções e focando no problema.

Parágrafo 3  
Visão inicial da oportunidade de aplicação de Inteligência Artificial e/ou análise de dados no contexto do cliente, de forma conceitual e não técnica.

Parágrafo 4  
Direcionamento preliminar da solução proposta pela GETTER, descrevendo o tipo de abordagem (ex.: monitoramento, análise, automação, suporte à decisão), sem entrar em escopo fechado.

Parágrafo 5  
Síntese final destacando o valor esperado do projeto para o cliente e apontando, de forma implícita, onde ainda podem existir pontos a esclarecer, detalhar ou complementar.

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

---

### **Step 2: Escopo do Projeto**

**Template Key:** `proposal.step2.questions`

**Prompt (Fase 1 - Gerar Perguntas):**
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

**Prompt (Fase 2 - Versão Ampliada):**
O mesmo template é usado, mas quando `{{CLOSER_ANSWERS}}` está preenchido, o prompt deve incluir instruções para gerar texto. **Nota:** O template atual não tem instruções explícitas para a versão ampliada - a IA infere que deve gerar texto quando há respostas. Para melhor controle, você pode adicionar ao template:

```
{{#if CLOSER_ANSWERS}}
RESPOSTAS DO CLOSER:
{{CLOSER_ANSWERS}}

PERGUNTAS ORIGINAIS:
{{QUESTIONS_JSON}}

INSTRUÇÕES PARA VERSÃO AMPLIADA:
Com base no resumo inicial (Step 1) e nas respostas do closer acima, crie uma **DESCRIÇÃO AMPLIADA DO PROJETO EM 8 PARÁGRAFOS** que:
1. Incorpora e expande o resumo do Step 1
2. Integra todas as respostas do closer de forma natural
3. Detalha o escopo, necessidades e contexto do projeto
4. Mantém consistência com as informações já validadas

Estrutura sugerida:
- Parágrafos 1-2: Contexto ampliado e situação atual
- Parágrafos 3-4: Desafios e necessidades detalhadas
- Parágrafos 5-6: Escopo do projeto e objetivos específicos
- Parágrafos 7-8: Direcionamento da solução e valor esperado

Retorne APENAS o texto com 8 parágrafos, sem formatação adicional.
{{/if}}
```

**Comportamento técnico:**
- Se `questionsJson` está vazio → API é chamada com `response_format: { type: 'json_object' }`
- Se `questionsJson` existe e `closerAnswers` existe → API é chamada sem `response_format` (texto livre)

---

### **Step 3: Contexto do Cliente e Desafio**

**Template Key:** `proposal.step3.context`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

---

### **Step 4: Objetivos do Projeto**

**Template Key:** `proposal.step4.objectives`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step5.solution`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step6.scope`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step7.phases`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step8.deliverables`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step9.benefits`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

**Template Key:** `proposal.step10.assumptions`

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

Cliente:
{{CLIENT_NAME}}

Empresa:
{{CLIENT_COMPANY}}

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

## 🔧 Sistema de Placeholders

### Placeholders Básicos

| Placeholder | Descrição | Exemplo |
|------------|-----------|---------|
| `{{TRANSCRIPT}}` | Transcrição completa da reunião | Texto da conversa |
| `{{CLIENT_NAME}}` | Nome do cliente | "João Silva" |
| `{{CLIENT_COMPANY}}` | Nome da empresa | "Empresa XYZ Ltda" |
| `{{CLIENT_LEAD_NAME}}` | Nome do contato/lead | "Maria Santos" |
| `{{CLIENT_PHONE}}` | Telefone do cliente | "+55 11 99999-9999" |
| `{{CLIENT_EMAIL}}` | Email do cliente | "joao@empresa.com" |
| `{{CLOSER_NAME}}` | Nome do closer | "Pedro Oliveira" |
| `{{MEETING_DATE}}` | Data da reunião | "03/02/2026" |
| `{{MEETING_ID}}` | ID da reunião | "meet_xxx" |

### Placeholders de Relatório

| Placeholder | Descrição | Quando Disponível |
|------------|-----------|-------------------|
| `{{REPORT_JSON}}` | JSON completo do relatório | Se reunião foi analisada |
| `{{REPORT_SUMMARY}}` | Resumo executivo do relatório | Se reunião foi analisada |
| `{{REPORT_SCORE}}` | Nota geral (0-100) | Se reunião foi analisada |

### Placeholders de Steps Anteriores

| Placeholder | Descrição | Quando Disponível |
|------------|-----------|-------------------|
| `{{STEP1_OUTPUT}}` | Texto final do Step 1 | Após Step 1 aprovado |
| `{{STEP2_OUTPUT}}` | Versão ampliada do Step 2 | Após Step 2 com finalText |
| `{{STEP3_OUTPUT}}` ... `{{STEP10_OUTPUT}}` | Texto final de cada step | Após step aprovado |
| `{{STEP_OUTPUT_PREV}}` | Último step aprovado | Sempre que houver step anterior |

**Regra importante:** `{{STEP2_OUTPUT}}` é usado como base principal em todos os steps 3-10, pois contém a descrição ampliada e validada do projeto.

### Placeholders de Input do Closer

| Placeholder | Descrição | Quando Disponível |
|------------|-----------|-------------------|
| `{{CLOSER_NOTES}}` | Notas/ajustes do closer | Quando closer adiciona notas (exceto Step 2) |
| `{{CLOSER_ANSWERS}}` | Respostas do closer às perguntas | Step 2, após responder perguntas |
| `{{QUESTIONS_JSON}}` | JSON com perguntas geradas | Step 2, após gerar perguntas |

---

## 🔄 Fluxo de Geração e Reprocessamento

### Geração Inicial (`/api/propostas/[id]/steps/[stepNumber]/generate`)

**Quando:** Closer clica em "Gerar Versão Inicial" ou "Gerar Perguntas"

**Processo:**
1. Valida que step não existe ou não tem `initialText`/`questionsJson`
2. Busca template do step
3. Constrói contexto completo (`buildProposalContext`)
4. Substitui placeholders (`replacePlaceholders`)
5. Chama `generateProposalStep`:
   - Configura modelo (GPT-4/GPT-5)
   - Para Step 2 sem perguntas: força JSON mode
   - Para outros casos: texto livre
6. Salva resultado:
   - Step 2 sem perguntas → `questionsJson`
   - Outros steps → `initialText`

**Retorno:** Step atualizado com conteúdo inicial

---

### Reprocessamento (`/api/propostas/[id]/steps/[stepNumber]/reprocess`)

**Quando:** Closer clica em "Reprocessar" ou "Gerar Versão Ampliada"

**Processo:**
1. Valida que step existe e tem `initialText` ou `questionsJson`
2. Atualiza `closerNotes` e/ou `closerAnswers` no banco
3. Chama `generateProposalStep` com `stepData` contendo:
   - `closerNotes` (notas do closer)
   - `closerAnswers` (respostas, se Step 2)
   - `questionsJson` (perguntas, se Step 2)
4. Template agora inclui `{{CLOSER_NOTES}}` e/ou `{{CLOSER_ANSWERS}}`
5. IA gera versão refinada incorporando os ajustes
6. Salva em `finalText`

**Diferença:** Reprocessamento incorpora feedback do closer no prompt

**Retorno:** Step atualizado com `finalText`

---

### Aprovação (`/api/propostas/[id]/steps/[stepNumber]/approve`)

**Quando:** Closer clica em "OK / Aprovar"

**Processo:**
1. Valida que step existe
2. Se não tem `finalText` mas tem `initialText`:
   - Copia `initialText` para `finalText`
3. Se Step 2 só tem `questionsJson` (sem versão ampliada):
   - Cria `finalText` básico: `"[Aprovado sem versão ampliada - apenas perguntas]"`
4. Atualiza `approvedAt` e `approvedBy`
5. Verifica se todos os steps foram aprovados:
   - Se sim: atualiza proposta para `status: 'completed'`
   - Se não: atualiza para `status: 'in_progress'`
6. Próximo step é liberado automaticamente

**Retorno:** Step aprovado, próximo step habilitado

---

## 🎯 Lógica de Construção de Contexto

### Função `buildProposalContext`

**Objetivo:** Montar objeto com todas as informações disponíveis para os prompts.

**Processo:**
1. Busca `Meeting` com relacionamentos (client, closer, report)
2. Busca `Proposal` e seus `steps`
3. Para cada step aprovado OU Step 2 com `finalText`:
   - Adiciona ao `previousSteps` com `finalText`
4. Parse do `Report` (se existir):
   - `insights` (JSON) → summary, action_plan, commitments
   - `criteriaScores` (JSON) → array de critérios
5. Retorna `ProposalContext` com:
   - `meeting` (id, date, fileName)
   - `client` (name, company, leadName, phone, email)
   - `closer` (name)
   - `transcript` (texto completo)
   - `report` (dados parseados ou null)
   - `previousSteps` (mapa stepNumber → { finalText })

**Uso:** Contexto é passado para `replacePlaceholders` junto com `stepData` (notas/respostas)

---

## 🔀 Substituição de Placeholders

### Função `replacePlaceholders`

**Objetivo:** Substituir todos os placeholders no template pelo conteúdo real.

**Processo:**
1. Substitui placeholders básicos (cliente, closer, data, etc.)
2. Substitui placeholders de relatório (se existir)
3. Substitui placeholders de steps anteriores:
   - `{{STEP1_OUTPUT}}` → `previousSteps[1]?.finalText`
   - `{{STEP2_OUTPUT}}` → `previousSteps[2]?.finalText` (ou `initialText` se não aprovado mas tem finalText)
   - `{{STEP_OUTPUT_PREV}}` → último step aprovado
4. Substitui placeholders de input do closer:
   - `{{CLOSER_NOTES}}` → `stepData.closerNotes`
   - `{{CLOSER_ANSWERS}}` → `stepData.closerAnswers`
   - `{{QUESTIONS_JSON}}` → `stepData.questionsJson`
5. Remove condicionais não suportadas (`{{#if}}`, `{{/if}}`)
6. Retorna prompt final pronto para OpenAI

**Regras especiais:**
- `{{STEP2_OUTPUT}}` pode usar `finalText` mesmo se Step 2 não estiver aprovado (para permitir que steps seguintes usem a versão ampliada)
- Placeholders vazios são substituídos por strings vazias ou "N/A"

---

## ⚙️ Configuração do Modelo OpenAI

### Parâmetros Configuráveis

**Via `ModelConfig` no banco:**
- `model` - Modelo a usar (ex: `gpt-4-turbo-preview`, `gpt-5.2`)
- `temperature` - Criatividade (0-2, padrão ~0.7)
- `topP` - Nucleus sampling (0-1)
- `maxTokens` - Máximo de tokens na resposta
- `reasoningEffort` - Para GPT-5: `low`, `medium`, `high` (opcional)
- `verbosity` - Para GPT-5: `low`, `medium`, `high` (opcional)

### Detecção de Modelo GPT-5

**Lógica:**
```typescript
const isGPT5 = modelConfig.model.startsWith('gpt-5')
```

**Diferenças:**
- GPT-5: usa `max_completion_tokens` em vez de `max_tokens`
- GPT-5: suporta `reasoning_effort` e `verbosity`
- Outros: usam `max_tokens`, `temperature`, `top_p`

### JSON Mode (Step 2)

**Quando:** Step 2, primeira geração (sem `questionsJson`)

**Configuração:**
```typescript
requestOptions.response_format = { type: 'json_object' }
```

**Validação:** Após receber resposta, valida que é JSON válido e tem estrutura esperada. Se falhar, tenta reparar com prompt adicional.

---

## 📊 Fluxo Completo de uma Proposta

### 1. Criação da Proposta

**Opção A: A partir de reunião analisada**
- Closer vai em `/resultados`
- Clica em "Gerar Proposta" em um resultado
- Sistema cria `Proposal` vinculada ao `meetingId`
- Redireciona para `/propostas?meetingId=xxx`

**Opção B: Criar do zero**
- Closer vai em `/propostas`
- Preenche formulário: closer, cliente, descrição
- Sistema cria `Client`, `Meeting` e `Proposal`
- Redireciona para wizard

### 2. Wizard de Steps

**Interface:**
- Sidebar esquerda: lista dos 10 steps
- Conteúdo principal: step ativo
- Indicadores visuais:
  - Verde: step aprovado
  - Amarelo: step com conteúdo mas não aprovado
  - Cinza: step bloqueado (step anterior não aprovado)

**Navegação:**
- Steps só podem ser acessados sequencialmente
- Step 1 sempre habilitado
- Step N só habilitado se Step N-1 estiver aprovado

### 3. Processo por Step

**Step 1:**
1. Closer clica "Gerar Versão Inicial"
2. Sistema gera resumo em 5 parágrafos
3. Closer pode adicionar notas em "Considerações do Closer"
4. Closer clica "Reprocessar" → versão refinada
5. Closer clica "OK / Aprovar Versão Final" → Step 2 liberado

**Step 2:**
1. Closer clica "Gerar Perguntas"
2. Sistema gera JSON com perguntas
3. Closer responde cada pergunta
4. Closer clica "Gerar Versão Ampliada (8 parágrafos)"
5. Sistema gera texto incorporando respostas
6. Closer pode aprovar com ou sem versão ampliada

**Steps 3-10:**
1. Closer clica "Gerar Versão Inicial"
2. Sistema gera seção usando steps anteriores como contexto
3. Closer pode adicionar notas
4. Closer clica "Reprocessar" → versão refinada
5. Closer clica "OK / Aprovar Versão Final" → próximo step liberado

### 4. Conclusão

**Quando todos os 10 steps são aprovados:**
- `Proposal.status` muda para `'completed'`
- Proposta está pronta para uso/exportação

---

## 🎨 Princípios de Design dos Prompts

### 1. **Base Principal: Step 2**

Todos os steps 3-10 usam `{{STEP2_OUTPUT}}` como base principal porque:
- Step 2 contém a descrição ampliada e validada
- Incorpora respostas do closer às perguntas
- É a fonte mais completa e precisa de informações

### 2. **Contexto Acumulativo**

Cada step tem acesso a:
- Transcrição original
- Todos os steps anteriores aprovados
- Relatório de análise (se existir)
- Informações do cliente e closer

### 3. **Iteração e Refinamento**

- **Versão Inicial:** Geração baseada apenas no contexto disponível
- **Reprocessamento:** Incorpora feedback do closer (`closerNotes` ou `closerAnswers`)
- **Aprovação:** Libera próximo step e torna conteúdo disponível para steps seguintes

### 4. **Validação pelo Closer**

- Cada step pode ser revisado antes de aprovar
- Closer pode adicionar notas para ajustar conteúdo
- Sistema permite aprovar versão inicial sem reprocessar (para agilizar)

---

## 🔍 Detalhes Técnicos Importantes

### Step 2 - Comportamento Especial

**Duas fases distintas:**

1. **Geração de Perguntas:**
   - `questionsJson` está vazio
   - API chamada com `response_format: { type: 'json_object' }`
   - Validação rigorosa de JSON
   - Se falhar, tenta reparar com prompt adicional

2. **Geração de Versão Ampliada:**
   - `questionsJson` existe
   - `closerAnswers` existe
   - API chamada **sem** `response_format` (texto livre)
   - Template deve incluir instruções para gerar 8 parágrafos
   - Incorpora respostas do closer

**Nota:** O template atual do Step 2 só tem instruções para gerar perguntas. Para a versão ampliada funcionar corretamente, o template precisa ser modificado para incluir instruções condicionais quando há `{{CLOSER_ANSWERS}}`.

### Disponibilidade de Steps Anteriores

**Regra:** Step N pode usar `{{STEPM_OUTPUT}}` se:
- Step M está aprovado (`approvedAt` não é null), OU
- Step M é o Step 2 e tem `finalText` (mesmo sem aprovação)

**Motivo:** Permite que steps seguintes usem a versão ampliada do Step 2 mesmo que o closer ainda não tenha aprovado formalmente.

### Tratamento de Erros

**Erros comuns e soluções:**

1. **Template não encontrado:**
   - Erro: `Template não encontrado para proposal.stepX.xxx`
   - Solução: Executar `npm run db:seed` para criar templates padrão

2. **JSON inválido no Step 2:**
   - Erro: `Resposta da IA não é um JSON válido`
   - Solução: Sistema tenta reparar automaticamente; se falhar, tentar novamente

3. **Step anterior não aprovado:**
   - Erro: Step bloqueado na interface
   - Solução: Aprovar step anterior primeiro

4. **Resposta vazia da API:**
   - Erro: `Resposta vazia da API do OpenAI`
   - Possíveis causas: `finishReason: 'length'` (aumentar `maxTokens`), API key inválida, modelo indisponível

---

## 📚 Estrutura de Arquivos

```
lib/
├── proposal.ts              # Constantes (PROPOSAL_STEPS), buildProposalContext, replacePlaceholders
└── proposalPrompts.ts       # generateProposalStep (lógica de chamada OpenAI)

app/
├── propostas/
│   ├── page.tsx             # Interface principal (wizard)
│   ├── lista/page.tsx       # Lista de propostas
│   └── configuracoes/page.tsx  # Edição de templates
└── api/
    └── propostas/
        ├── route.ts         # GET (listar), POST (criar)
        └── [id]/
            ├── route.ts     # GET (buscar), DELETE
            └── steps/
                └── [stepNumber]/
                    ├── route.ts           # PUT (atualizar notas/respostas)
                    ├── generate/route.ts  # POST (gerar inicial)
                    ├── reprocess/route.ts # POST (reprocessar com ajustes)
                    └── approve/route.ts   # POST (aprovar step)
```

---

## 🎯 Checklist para Implementar em Outro Projeto

### Estrutura de Banco de Dados

- [ ] Modelo `Proposal` com campos: id, meetingId, status, createdAt, updatedAt
- [ ] Modelo `ProposalStep` com campos: id, proposalId, stepNumber, stepKey, initialText, finalText, questionsJson, closerAnswers, closerNotes, approvedAt, approvedBy
- [ ] Modelo `PromptTemplate` com campos: id, name, content, category, stepKey, active, version
- [ ] Relacionamentos: Proposal → Meeting, Proposal → ProposalStep[], ProposalStep → Proposal

### Lógica de Negócio

- [ ] Função `buildProposalContext` - construir contexto completo
- [ ] Função `replacePlaceholders` - substituir placeholders no template
- [ ] Função `generateProposalStep` - chamar OpenAI e gerar conteúdo
- [ ] Validação de JSON para Step 2 (fase de perguntas)
- [ ] Lógica de aprovação e liberação de steps sequenciais

### API Endpoints

- [ ] `POST /api/propostas` - Criar proposta
- [ ] `GET /api/propostas` - Listar propostas
- [ ] `GET /api/propostas/[id]` - Buscar proposta específica
- [ ] `POST /api/propostas/[id]/steps/[stepNumber]/generate` - Gerar conteúdo inicial
- [ ] `POST /api/propostas/[id]/steps/[stepNumber]/reprocess` - Reprocessar com ajustes
- [ ] `POST /api/propostas/[id]/steps/[stepNumber]/approve` - Aprovar step
- [ ] `PUT /api/propostas/[id]/steps/[stepNumber]` - Atualizar notas/respostas

### Interface do Usuário

- [ ] Wizard com sidebar de steps
- [ ] Indicadores visuais de status (aprovado/pendente/bloqueado)
- [ ] Formulário para criar proposta do zero
- [ ] Lista de propostas com progresso
- [ ] Editor de templates (opcional, para customização)

### Templates de Prompt

- [ ] Criar 10 templates padrão (um para cada step)
- [ ] Templates devem usar placeholders documentados
- [ ] Step 2 deve ter instruções para ambas as fases (perguntas e versão ampliada)

---

## 💡 Dicas de Implementação

1. **Comece pelo Step 1:** Implemente primeiro o Step 1 para validar o fluxo básico antes de adicionar complexidade do Step 2.

2. **Step 2 é especial:** Requer tratamento diferenciado para JSON vs texto. Considere criar duas funções separadas ou flags claras.

3. **Teste placeholders:** Garanta que todos os placeholders são substituídos corretamente. Use logs para debugar.

4. **Validação de JSON:** No Step 2, valide rigorosamente o JSON retornado. Implemente reparação automática se possível.

5. **Tratamento de erros:** Sempre trate erros da API OpenAI graciosamente. Mostre mensagens claras ao usuário.

6. **Performance:** Considere cache de templates se forem consultados frequentemente. Use índices no banco para `stepKey` e `category`.

7. **Versionamento:** O campo `version` em `PromptTemplate` permite versionar templates. Considere implementar histórico de versões.

---

## 📖 Exemplo de Uso Completo

### Cenário: Criar proposta a partir de reunião

1. **Reunião existe** com transcrição, cliente, closer
2. **Criar proposta:**
   ```typescript
   POST /api/propostas
   { meetingId: "meet_xxx" }
   ```
3. **Gerar Step 1:**
   ```typescript
   POST /api/propostas/prop_xxx/steps/1/generate
   ```
   - Sistema busca template `proposal.step1.summary`
   - Substitui `{{TRANSCRIPT}}`, `{{CLIENT_NAME}}`, etc.
   - Chama OpenAI
   - Salva em `initialText`
4. **Closer adiciona notas:**
   ```typescript
   PUT /api/propostas/prop_xxx/steps/1
   { closerNotes: "Adicionar informação sobre integração SAP" }
   ```
5. **Reprocessar Step 1:**
   ```typescript
   POST /api/propostas/prop_xxx/steps/1/reprocess
   { closerNotes: "Adicionar informação sobre integração SAP" }
   ```
   - Template agora inclui `{{CLOSER_NOTES}}`
   - IA gera versão refinada
   - Salva em `finalText`
6. **Aprovar Step 1:**
   ```typescript
   POST /api/propostas/prop_xxx/steps/1/approve
   ```
   - `approvedAt` preenchido
   - Step 2 liberado
7. **Gerar perguntas (Step 2):**
   ```typescript
   POST /api/propostas/prop_xxx/steps/2/generate
   ```
   - Força JSON mode
   - Gera perguntas
   - Salva em `questionsJson`
8. **Closer responde:**
   ```typescript
   PUT /api/propostas/prop_xxx/steps/2
   { closerAnswers: '{"0": "R$ 200.000", "1": "6 meses", ...}' }
   ```
9. **Gerar versão ampliada:**
   ```typescript
   POST /api/propostas/prop_xxx/steps/2/reprocess
   { closerAnswers: '{"0": "R$ 200.000", ...}' }
   ```
   - Sem JSON mode
   - Gera 8 parágrafos
   - Salva em `finalText`
10. **Aprovar Step 2:**
    ```typescript
    POST /api/propostas/prop_xxx/steps/2/approve
    ```
    - Step 3 liberado
11. **Repetir para Steps 3-10:**
    - Cada step usa `{{STEP2_OUTPUT}}` e steps anteriores
    - Processo: Gerar → Ajustar → Reprocessar → Aprovar
12. **Proposta completa:**
    - Todos os 10 steps aprovados
    - `status: 'completed'`

---

---

## 📋 Resumo Executivo

### Conceito Principal

Sistema de criação de propostas comerciais através de **10 etapas sequenciais** onde:
- Cada etapa gera uma seção da proposta usando IA (OpenAI)
- O closer revisa, ajusta e aprova cada etapa
- Etapas anteriores servem como contexto para etapas seguintes
- Step 2 é especial: gera perguntas primeiro, depois versão ampliada com respostas

### Fluxo Simplificado

```
Criar Proposta
  ↓
Step 1: Gerar resumo (5 parágrafos) → Ajustar → Aprovar
  ↓
Step 2: Gerar perguntas → Responder → Gerar ampliada (8 parágrafos) → Aprovar
  ↓
Steps 3-10: Gerar seção → Ajustar → Reprocessar → Aprovar (repetir)
  ↓
Proposta Completa
```

### Componentes Principais

1. **Templates de Prompt** - Armazenados no banco, um por step
2. **Sistema de Placeholders** - Substituição dinâmica de variáveis
3. **Contexto Acumulativo** - Cada step usa outputs dos anteriores
4. **Iteração Controlada** - Closer pode ajustar antes de aprovar
5. **Aprovação Sequencial** - Steps só liberam após aprovação do anterior

### Diferenciais do Sistema

- **Step 2 especial:** Gera perguntas para o closer responder, depois cria versão ampliada
- **Base principal:** Todos os steps 3-10 usam Step 2 como fonte principal de informações
- **Reprocessamento:** Permite refinar conteúdo incorporando feedback do closer
- **Flexibilidade:** Closer pode aprovar versão inicial sem reprocessar (agilidade)

---

## 🚀 Como Usar Este Documento

### Para Implementar em Outro Projeto

1. **Leia a seção "Arquitetura do Sistema"** - Entenda a estrutura de dados
2. **Revise os "Prompts Completos por Etapa"** - Copie e adapte os templates
3. **Implemente a lógica básica:**
   - `buildProposalContext` - Construir contexto
   - `replacePlaceholders` - Substituir variáveis
   - `generateProposalStep` - Chamar OpenAI
4. **Crie os endpoints da API** seguindo os padrões documentados
5. **Implemente a interface** do wizard de steps
6. **Teste cada step** individualmente antes de integrar

### Para Entender o Sistema Atual

1. **Comece pelo "Fluxo Completo"** - Visão geral do processo
2. **Leia "Lógica de Cada Etapa"** - Como cada step funciona
3. **Consulte "Prompts Completos"** - Veja exatamente o que é enviado à IA
4. **Revise "Detalhes Técnicos"** - Entenda comportamentos especiais

### Para Customizar

1. **Modifique os templates** em `prisma/seed.ts` ou via interface
2. **Ajuste placeholders** conforme suas necessidades
3. **Adicione novos steps** se necessário (atualizar `PROPOSAL_STEPS`)
4. **Customize validações** e regras de aprovação

---

## ⚠️ Notas Importantes

### Step 2 - Template Precisa de Ajuste

O template atual do Step 2 (`proposal.step2.questions`) só tem instruções para gerar perguntas. Para a versão ampliada funcionar corretamente, você deve:

1. **Opção A:** Modificar o template para incluir instruções condicionais quando há `{{CLOSER_ANSWERS}}`
2. **Opção B:** Criar um template separado para a versão ampliada (ex: `proposal.step2.amplified`)
3. **Opção C:** Confiar que a IA infere que deve gerar texto quando há respostas (funciona mas é menos confiável)

**Recomendação:** Use Opção A - adicione ao template atual instruções explícitas para quando `{{CLOSER_ANSWERS}}` estiver preenchido.

### Placeholders Condicionais

O sistema atual não suporta condicionais como `{{#if CLOSER_ANSWERS}}`. Eles são removidos durante `replacePlaceholders`. Se precisar de lógica condicional, implemente no código antes de chamar `replacePlaceholders`.

### Versionamento de Templates

O campo `version` em `PromptTemplate` permite versionar, mas o sistema atual não implementa histórico. Considere adicionar uma tabela `PromptTemplateHistory` se precisar rastrear mudanças.

---

Este documento serve como guia completo para replicar o sistema de criação de propostas em outro projeto. Adapte conforme necessário para o contexto específico do novo projeto.

**Última atualização:** Baseado no código do projeto "Agente Comercial" em fevereiro de 2026.
