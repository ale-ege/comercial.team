import { z } from 'zod'

export const analyzeRequestSchema = z.object({
  clientId: z.string().min(1),
  closerId: z.string().min(1),
  transcript: z.string().min(10),
  fileName: z.string().optional().nullable(),
})

export const criterionScoreSchema = z.object({
  id: z.string().optional(), // ID pode ser opcional se não vier do modelo
  name: z.string(),
  score_0_10: z.number().min(0).max(10),
  weight: z.number().optional(), // Peso pode vir do banco
  evidence_quotes: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  positives: z.array(z.string()).optional(),
})

export const actionPlanItemSchema = z.object({
  priority: z.number(),
  action: z.string(),
  criterion: z.string(),
})

export const metadataSchema = z.object({
  risks: z.array(z.string()).optional(),
  next_steps_clarity: z.number().min(0).max(10).optional().nullable(),
  objections_quality: z.number().min(0).max(10).optional().nullable(),
  talk_ratio_estimate: z.number().min(0).max(1).optional().nullable(), // Permite null quando não pode ser calculado
  client_engagement: z.number().min(0).max(10).optional().nullable(),
})

export const chartDataSchema = z.object({
  radar: z.object({
    labels: z.array(z.string()),
    scores: z.array(z.number()),
  }).optional(),
  bar: z.object({
    labels: z.array(z.string()),
    scores: z.array(z.number()),
  }).optional(),
})

export const commitmentActionSchema = z.object({
  action: z.string(),
  due_when: z.string().nullable().optional(),
  evidence_quote: z.string(),
})

export const commitmentsSchema = z.object({
  closer_actions: z.array(commitmentActionSchema).optional(),
  lead_actions: z.array(commitmentActionSchema).optional(),
})

export const analyzeResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  criteria: z.array(criterionScoreSchema),
  summary: z.string(),
  action_plan: z.array(actionPlanItemSchema).optional(),
  commitments: commitmentsSchema.optional(),
  metadata: metadataSchema.optional(),
  chart_data: chartDataSchema.optional(),
})

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>
export type CriterionScore = z.infer<typeof criterionScoreSchema>