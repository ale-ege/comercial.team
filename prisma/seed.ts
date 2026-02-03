import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar critérios padrão (ordem e pesos conforme especificado pelo usuário)
  const criteria = [
    {
      name: 'Abertura e Rapport',
      description: 'Avalia como o closer inicia a conversa, estabelece conexão e cria um ambiente de confiança.',
      weight: 1.0,
      examples: JSON.stringify([
        'Cumprimento caloroso e personalizado',
        'Demonstra interesse genuíno pelo cliente',
        'Estabelece tom profissional mas amigável'
      ]),
      rules: JSON.stringify([
        'Verificar se há cumprimento adequado',
        'Avaliar se o closer demonstra conhecimento prévio sobre o cliente',
        'Verificar se o tom é apropriado para o contexto'
      ]),
      goodExamples: 'Cumprimento personalizado mencionando algo específico do cliente, demonstração de interesse genuíno, tom profissional e amigável.',
      badExamples: 'Cumprimento genérico, falta de personalização, tom muito formal ou muito casual, não demonstra interesse.'
    },
    {
      name: 'Clareza do Problema e Dor',
      description: 'Avalia se o closer conseguiu identificar e clarificar o problema principal e as dores do cliente.',
      weight: 1.3,
      examples: JSON.stringify([
        'Identifica o problema raiz',
        'Clarifica o impacto do problema',
        'Quantifica a dor quando possível'
      ]),
      rules: JSON.stringify([
        'Verificar se o problema foi claramente identificado',
        'Avaliar se o impacto foi explorado',
        'Verificar se há quantificação da dor'
      ]),
      goodExamples: 'Problema claramente identificado, impacto explorado em detalhes, dor quantificada quando possível, cliente confirma o entendimento.',
      badExamples: 'Problema não ficou claro, impacto não foi explorado, não há quantificação, cliente não confirma o entendimento.'
    },
    {
      name: 'Comunicação (Clareza e Objetividade)',
      description: 'Avalia a clareza, objetividade e efetividade da comunicação do closer.',
      weight: 1.0,
      examples: JSON.stringify([
        'Linguagem clara e objetiva',
        'Evita jargões desnecessários',
        'Adapta a comunicação ao perfil do cliente'
      ]),
      rules: JSON.stringify([
        'Verificar se a linguagem é clara e objetiva',
        'Avaliar o uso de jargões',
        'Verificar se a comunicação foi adaptada ao cliente'
      ]),
      goodExamples: 'Linguagem clara e objetiva, evita jargões, adapta comunicação ao perfil do cliente, usa exemplos quando necessário.',
      badExamples: 'Linguagem confusa ou vaga, muitos jargões, comunicação não adaptada, falta de exemplos quando necessário.'
    },
    {
      name: 'Condução e Controle da Call',
      description: 'Avalia como o closer conduz a conversa, mantém o foco e controla o tempo.',
      weight: 1.1,
      examples: JSON.stringify([
        'Mantém a conversa no caminho certo',
        'Gerencia o tempo adequadamente',
        'Transições suaves entre tópicos'
      ]),
      rules: JSON.stringify([
        'Verificar se a conversa segue uma estrutura lógica',
        'Avaliar o gerenciamento de tempo',
        'Verificar transições entre tópicos'
      ]),
      goodExamples: 'Conversa bem estruturada, tempo gerenciado adequadamente, transições suaves, mantém foco nos objetivos.',
      badExamples: 'Conversa desorganizada, tempo mal gerenciado, transições abruptas, perde foco facilmente.'
    },
    {
      name: 'Descoberta (Perguntas e Profundidade)',
      description: 'Avalia a qualidade das perguntas feitas para entender as necessidades, dores e contexto do cliente.',
      weight: 1.2,
      examples: JSON.stringify([
        'Perguntas abertas que exploram o problema',
        'Perguntas de follow-up que aprofundam o entendimento',
        'Escuta ativa e validação das respostas'
      ]),
      rules: JSON.stringify([
        'Verificar se as perguntas são abertas e exploratórias',
        'Avaliar a profundidade das perguntas de follow-up',
        'Verificar se o closer escuta ativamente e valida respostas'
      ]),
      goodExamples: 'Perguntas abertas que exploram o problema em profundidade, follow-ups inteligentes, escuta ativa, validação das respostas do cliente.',
      badExamples: 'Perguntas fechadas demais, não aprofunda nas respostas, interrompe o cliente, não valida o que foi dito.'
    },
    {
      name: 'Proposta de Valor e Conexão com Dor',
      description: 'Avalia como a solução foi apresentada e conectada com as dores identificadas.',
      weight: 1.4,
      examples: JSON.stringify([
        'Conecta características da solução com dores específicas',
        'Apresenta benefícios claros e relevantes',
        'Usa casos de uso ou exemplos concretos'
      ]),
      rules: JSON.stringify([
        'Verificar se há conexão clara entre solução e dor',
        'Avaliar se os benefícios são relevantes para o cliente',
        'Verificar se há exemplos ou casos de uso'
      ]),
      goodExamples: 'Conexão clara entre solução e dor identificada, benefícios relevantes e específicos, exemplos concretos e casos de uso.',
      badExamples: 'Solução apresentada de forma genérica, não conecta com as dores, benefícios não são relevantes, falta de exemplos.'
    },
    {
      name: 'Próximos Passos e Fechamento',
      description: 'Avalia a clareza e efetividade do fechamento e definição dos próximos passos.',
      weight: 1.0,
      examples: JSON.stringify([
        'Define próximos passos claros e específicos',
        'Estabelece prazos e responsabilidades',
        'Confirma compromisso do cliente'
      ]),
      rules: JSON.stringify([
        'Verificar se os próximos passos são claros e específicos',
        'Avaliar se há prazos e responsabilidades definidos',
        'Verificar se o compromisso do cliente foi confirmado'
      ]),
      goodExamples: 'Próximos passos claros e específicos, prazos e responsabilidades definidos, compromisso do cliente confirmado, follow-up agendado.',
      badExamples: 'Próximos passos vagos ou indefinidos, falta de prazos, compromisso não confirmado, sem follow-up agendado.'
    },
    {
      name: 'Tratamento de Objeções',
      description: 'Avalia como o closer lida com objeções, dúvidas e resistências do cliente.',
      weight: 1.0,
      examples: JSON.stringify([
        'Reconhece e valida a objeção',
        'Explora a objeção antes de responder',
        'Fornece resposta clara e convincente'
      ]),
      rules: JSON.stringify([
        'Verificar se a objeção foi reconhecida e validada',
        'Avaliar se a objeção foi explorada antes de responder',
        'Verificar se a resposta foi clara e convincente'
      ]),
      goodExamples: 'Reconhece e valida a objeção, explora antes de responder, fornece resposta clara e convincente, verifica se a objeção foi resolvida.',
      badExamples: 'Ignora ou minimiza a objeção, responde sem explorar, resposta vaga ou não convincente, não verifica se foi resolvida.'
    }
  ]

  // Atualizar ou criar critérios (garantir nomes e pesos corretos)
  for (const criterion of criteria) {
    const existing = await prisma.criterion.findFirst({
      where: { name: criterion.name },
    })
    
    if (existing) {
      // Atualizar critério existente para garantir peso e dados corretos
      await prisma.criterion.update({
        where: { id: existing.id },
        data: {
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          examples: criterion.examples,
          rules: criterion.rules,
          goodExamples: criterion.goodExamples,
          badExamples: criterion.badExamples,
          active: true,
        },
      })
      console.log(`✅ Critério atualizado: ${criterion.name} (peso: ${criterion.weight})`)
    } else {
      // Criar novo critério
      await prisma.criterion.create({
        data: criterion,
      })
      console.log(`✅ Critério criado: ${criterion.name} (peso: ${criterion.weight})`)
    }
  }

  console.log('✅ Critérios criados')

  // Criar prompt template padrão
  const defaultPrompt = `Você é um analista sênior especializado em avaliação de reuniões de vendas técnicas (technical sales calls) voltadas a soluções de Inteligência Artificial para a indústria, incluindo, mas não se limitando a:

Visão computacional industrial

Machine Learning aplicado a processos produtivos

IA generativa e agentes inteligentes

Integração com CLPs, ERPs, MES, APS, BI e sistemas industriais

Projetos de automação, eficiência operacional, qualidade, segurança e OEE

Seu papel é avaliar criticamente o desempenho do closer da Getter em uma call de vendas consultiva e técnica, considerando sua capacidade de:

Diagnosticar problemas industriais reais

Conduzir discovery técnico aprofundado

Traduzir desafios operacionais em soluções de IA viáveis

Demonstrar domínio técnico e clareza comercial

Construir confiança com engenheiros, gestores e decisores industriais

Definir e formalizar próximos passos objetivos

CRITÉRIOS DE AVALIAÇÃO

{{CRITERIA_LIST}}

Cada critério representa um aspecto crítico da venda técnica de soluções de IA para a indústria.

IMPORTANTE: Use o ID e o Nome EXATO de cada critério conforme fornecido acima. Não altere ou modifique os nomes dos critérios.

INSTRUÇÕES DE ANÁLISE

Leia toda a transcrição com atenção, considerando o contexto industrial do cliente

Avalie exclusivamente o desempenho do closer (vendedor técnico), não o cliente

Para cada critério, atribua uma nota de 0 a 10

Justifique cada nota com citações literais da transcrição sempre que possível

Liste comportamentos observáveis positivos e oportunidades objetivas de melhoria

Calcule a nota geral (0–100) usando média ponderada obrigatória

Gere um resumo executivo técnico-comercial da performance do closer

Crie um plano de ação priorizado, focado em melhoria prática e aplicável

Analise aspectos adicionais da call:

Riscos técnicos ou comerciais identificados

Clareza dos próximos passos

Qualidade do tratamento de objeções técnicas

Engajamento do cliente

Proporção estimada de fala

Analise a conversa como um todo e identifique TODOS os compromissos explícitos ou implícitos acordados entre closer e lead, separando claramente responsabilidades.

COMPROMISSOS (commitments):
Identifique e extraia TODAS as ações que foram acordadas durante a reunião, incluindo:

Ações do Closer (closer_actions):
- Qualquer tarefa que o closer se comprometeu a fazer
- Exemplos: "Vou pesquisar câmera e montar proposta", "Vou enviar apresentação em PDF", "Vou verificar disponibilidade", "Vou preparar orçamento"
- Inclua a ação clara, o prazo (se mencionado) e a citação da transcrição que evidencia o compromisso

Ações do Cliente/Lead (lead_actions):
- Qualquer tarefa que o cliente se comprometeu a fazer
- Exemplos: "Cliente vai enviar material", "Cliente vai agendar reunião com equipe técnica", "Cliente vai verificar orçamento interno"
- Inclua a ação clara, o prazo (se mencionado) e a citação da transcrição que evidencia o compromisso

IMPORTANTE: Seja abrangente - capture TODOS os compromissos mencionados, mesmo que pareçam pequenos ou informais. Use citações literais da transcrição sempre que possível.

REGRA OBRIGATÓRIA — CÁLCULO DA NOTA GERAL

A nota geral (overall_score, escala de 0 a 100) deve ser calculada exatamente da seguinte forma:

Para cada critério:
score_ponderado = score_0_10 × weight

Somar todos os scores ponderados

Dividir o resultado pela soma total dos pesos

Multiplicar o valor final por 10

Arredondar para no máximo 1 casa decimal

DEFINIÇÕES IMPORTANTES

talk_ratio_estimate

Valor entre 0 e 1

Representa a proporção do tempo de fala do closer em relação ao total da call

Compromissos / Acordos

Considere como acordo qualquer ação que:

Tenha sido verbalmente confirmada

Tenha sido aceita sem objeção

Tenha sido explicitamente combinada como "próximo passo"

Evidências

Utilize citações literais da transcrição sempre que possível

Caso não exista citação direta, descreva claramente o trecho da conversa

FORMATO DE RESPOSTA (JSON ESTRITO)
REGRAS ABSOLUTAS DE FORMATAÇÃO

Retorne APENAS o JSON

Não utilize markdown

Não inclua comentários, explicações ou texto fora do JSON

Não utilize trailing commas

Todos os campos devem estar preenchidos

{
  "overall_score": 0,
  "criteria": [
    {
      "id": "criterion_id",
      "name": "Nome EXATO do Critério do banco de dados",
      "score_0_10": 0,
      "weight": 0,
      "evidence_quotes": [
        "citação literal da transcrição"
      ],
      "positives": [
        "comportamento observável positivo"
      ],
      "improvements": [
        "oportunidade objetiva de melhoria"
      ]
    }
  ],
  "summary": "Resumo executivo técnico-comercial em um parágrafo sobre a performance geral do closer.",
  "action_plan": [
    {
      "priority": 1,
      "action": "Ação prática de melhoria para o closer",
      "criterion": "Nome do critério relacionado"
    }
  ],
  "commitments": {
    "closer_actions": [
      {
        "action": "Descrição clara da ação acordada",
        "due_when": "prazo estimado se mencionado, senão null",
        "evidence_quote": "trecho da transcrição que indica o acordo"
      }
    ],
    "lead_actions": [
      {
        "action": "Descrição clara da ação acordada",
        "due_when": "prazo estimado se mencionado, senão null",
        "evidence_quote": "trecho da transcrição que indica o acordo"
      }
    ]
  },
  "metadata": {
    "risks": [
      "risco técnico identificado"
    ],
    "next_steps_clarity": 0,
    "objections_quality": 0,
    "talk_ratio_estimate": 0.0,
    "client_engagement": 0
  },
  "chart_data": {
    "radar": {
      "labels": ["Critério 1", "Critério 2"],
      "scores": [0, 0]
    },
    "bar": {
      "labels": ["Critério 1", "Critério 2"],
      "scores": [0, 0]
    }
  }
}

CRÍTICO: Use o ID e o Nome EXATO de cada critério conforme fornecido acima. Não altere ou modifique os nomes dos critérios. O campo "name" deve ser EXATAMENTE igual ao nome fornecido na lista de critérios.

DADOS DA CALL

TRANSCRIÇÃO:
{{TRANSCRIPT}}

CLIENTE:
{{CLIENT_NAME}}

CLOSER (Getter):
{{CLOSER_NAME}}`

  // Verificar se já existe template ativo
  const existingTemplate = await prisma.promptTemplate.findFirst({
    where: { active: true },
  })

  if (!existingTemplate) {
    await prisma.promptTemplate.create({
      data: {
        name: 'Template Padrão',
        content: defaultPrompt,
        active: true,
        version: 1,
      },
    })
  }

  console.log('✅ Prompt template criado')

  // Criar ou atualizar configuração de modelo padrão
  const existingConfig = await prisma.modelConfig.findFirst({
    where: { active: true },
  })

  if (!existingConfig) {
    await prisma.modelConfig.create({
      data: {
        model: 'gpt-5.2',
        temperature: 0.7,
        topP: 1.0,
        maxTokens: 8000, // Aumentado para acomodar reasoning_tokens + completion_tokens
        reasoningEffort: 'none', // none, low, medium, high, xhigh
        verbosity: 'medium', // low, medium, high
        active: true,
      },
    })
  } else {
    // Atualizar configuração existente para usar 8000 tokens
    await prisma.modelConfig.update({
      where: { id: existingConfig.id },
      data: {
        maxTokens: 8000,
        model: 'gpt-5.2',
        reasoningEffort: existingConfig.reasoningEffort || 'none',
        verbosity: existingConfig.verbosity || 'medium',
      },
    })
  }

  console.log('✅ Configuração de modelo criada')

  // Criar templates padrão para as 10 etapas de proposta
  const proposalSteps = [
    {
      stepKey: 'proposal.step1.summary',
      name: 'Proposta - Ideia Inicial do Projeto',
      content: `Você é um consultor sênior da GETTER, especialista em projetos de Inteligência Artificial aplicada à indústria, automação, visão computacional, machine learning e integração de dados operacionais.

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
Não inclua explicações, comentários ou observações adicionais.`,
    },
    {
      stepKey: 'proposal.step2.questions',
      name: 'Proposta - Escopo do Projeto',
      content: `Você é um especialista em análise de propostas comerciais.

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

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional.`,
    },
    {
      stepKey: 'proposal.step3.context',
      name: 'Proposta - Contexto do Cliente e Desafio',
      content: `Com base na transcrição e informações coletadas, crie uma seção detalhada sobre o CONTEXTO DO CLIENTE E DESAFIO.

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

Markdown com títulos H2/H3 e parágrafos bem estruturados.`,
    },
    {
      stepKey: 'proposal.step4.objectives',
      name: 'Proposta - Objetivos do Projeto',
      content: `Crie uma seção sobre os OBJETIVOS DO PROJETO.

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

Markdown estruturado com bullets e numeração.`,
    },
    {
      stepKey: 'proposal.step5.solution',
      name: 'Proposta - Visão Geral da Solução Getter',
      content: `Crie uma seção sobre a VISÃO GERAL DA SOLUÇÃO GETTER.

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

Markdown com títulos e parágrafos bem estruturados.`,
    },
    {
      stepKey: 'proposal.step6.scope',
      name: 'Proposta - Escopo Funcional do Projeto',
      content: `Crie uma seção detalhada sobre o ESCOPO FUNCIONAL DO PROJETO.

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

Markdown estruturado com listas e sublistas.`,
    },
    {
      stepKey: 'proposal.step7.phases',
      name: 'Proposta - Fases do Projeto',
      content: `Crie uma seção sobre as FASES DO PROJETO.

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

Markdown com títulos H3 para cada fase e bullets para atividades.`,
    },
    {
      stepKey: 'proposal.step8.deliverables',
      name: 'Proposta - Entregáveis por Fase',
      content: `Crie uma seção detalhada sobre os ENTREGÁVEIS POR FASE.

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

Markdown com títulos H3 para cada fase e bullets para entregáveis.`,
    },
    {
      stepKey: 'proposal.step9.benefits',
      name: 'Proposta - Benefícios e ROI Esperado',
      content: `Crie uma seção sobre BENEFÍCIOS E ROI ESPERADO.

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

Markdown com títulos e bullets.`,
    },
    {
      stepKey: 'proposal.step10.assumptions',
      name: 'Proposta - Premissas e Responsabilidades',
      content: `Crie uma seção sobre PREMISSAS E RESPONSABILIDADES.

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

Markdown com títulos H3 para "Premissas" e "Responsabilidades", e bullets para cada item.`,
    },
  ]

  for (const stepTemplate of proposalSteps) {
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        category: 'proposal',
        stepKey: stepTemplate.stepKey,
        active: true,
      },
    })

    if (!existing) {
      await prisma.promptTemplate.create({
        data: {
          name: stepTemplate.name,
          content: stepTemplate.content,
          category: 'proposal',
          stepKey: stepTemplate.stepKey,
          active: true,
          version: 1,
        },
      })
      console.log(`✅ Template criado: ${stepTemplate.stepKey}`)
    }
  }

  console.log('✅ Templates de proposta criados')

  const userCount = await prisma.user.count()
  if (userCount === 0) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: hashPassword('admin123'),
        name: 'Administrador',
        active: true,
      },
    })
    console.log('✅ Usuário inicial criado: admin@example.com / admin123 (altere a senha após o primeiro login)')
  }

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })