import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { chamarClaude, limparCercasJson } from '#/lib/server/claude'
import { saoSemelhantes } from '#/lib/similaridade'
import { labelTipoProjeto } from '#/lib/projeto-tipos'

const planoSchema = z.object({
  ferramentas: z.array(
    z.object({
      nome: z.string(),
      ja_tenho: z.boolean(),
      essencial: z.boolean(),
    }),
  ),
  materiais: z.array(
    z.object({
      nome: z.string(),
      quantidade: z.number(),
      unidade: z.string(),
    }),
  ),
  etapas: z.array(z.string()),
  horas_estimadas: z.number(),
  alertas_seguranca: z.array(z.string()),
  observacoes: z.string(),
})

export interface FerramentaSugerida {
  nome: string
  essencial: boolean
  ferramentaId: string | null
  cadastrada: boolean
  jaTenho: boolean
}

export interface PlanoProjeto {
  ferramentas: Array<FerramentaSugerida>
  materiais: Array<{ nome: string; quantidade: number; unidade: string }>
  etapas: Array<string>
  horasEstimadas: number
  alertasSeguranca: Array<string>
  observacoes: string
}

const planejarSchema = z.object({ projetoId: z.string().uuid() })

export const planejarProjeto = createServerFn({ method: 'POST' })
  .validator(planejarSchema)
  .handler(async ({ data }): Promise<PlanoProjeto> => {
    const supabase = getSupabaseServerClient()

    const [{ data: projeto, error: projetoError }, { data: ferramentas, error: ferramentasError }] =
      await Promise.all([
        supabase
          .from('projetos')
          .select('titulo, descricao, tipo')
          .eq('id', data.projetoId)
          .single(),
        supabase.from('ferramentas').select('id, nome, status'),
      ])
    if (projetoError) throw new Error('Projeto não encontrado.')
    if (ferramentasError) throw new Error(ferramentasError.message)

    const listaFerramentas = ferramentas
      .map((f) => `- ${f.nome} (${f.status === 'comprada' ? 'já tenho' : 'quero comprar'})`)
      .join('\n')

    const prompt = `Planeje o serviço abaixo pra mim.

Título: ${projeto.titulo}
Tipo: ${labelTipoProjeto(projeto.tipo)}
Descrição: ${projeto.descricao ?? '(sem descrição)'}

Minhas ferramentas cadastradas:
${listaFerramentas || '(nenhuma cadastrada ainda)'}

Responda SOMENTE com um JSON válido (sem cercas de markdown, sem texto antes ou depois), no formato exato:
{
  "ferramentas": [{ "nome": "", "ja_tenho": true, "essencial": true }],
  "materiais": [{ "nome": "", "quantidade": 0, "unidade": "" }],
  "etapas": [""],
  "horas_estimadas": 0,
  "alertas_seguranca": [""],
  "observacoes": ""
}`

    const resposta = await chamarClaude({ prompt, maxTokens: 8000 })

    let json: unknown
    try {
      json = JSON.parse(limparCercasJson(resposta))
    } catch {
      throw new Error('A IA respondeu num formato inesperado. Tenta de novo.')
    }

    const parseResult = planoSchema.safeParse(json)
    if (!parseResult.success) {
      throw new Error('A IA respondeu num formato inesperado. Tenta de novo.')
    }
    const plano = parseResult.data

    const ferramentasSugeridas: Array<FerramentaSugerida> = plano.ferramentas.map((f) => {
      const match = ferramentas.find((cad) => saoSemelhantes(cad.nome, f.nome))
      return {
        nome: f.nome,
        essencial: f.essencial,
        ferramentaId: match?.id ?? null,
        cadastrada: !!match,
        jaTenho: match ? match.status === 'comprada' : false,
      }
    })

    return {
      ferramentas: ferramentasSugeridas,
      materiais: plano.materiais,
      etapas: plano.etapas,
      horasEstimadas: plano.horas_estimadas,
      alertasSeguranca: plano.alertas_seguranca,
      observacoes: plano.observacoes,
    }
  })

const salvarNotasSchema = z.object({
  projetoId: z.string().uuid(),
  etapas: z.array(z.string()),
  horasEstimadas: z.number(),
  alertasSeguranca: z.array(z.string()),
  observacoes: z.string(),
})

export const salvarNotasIa = createServerFn({ method: 'POST' })
  .validator(salvarNotasSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('projetos')
      .update({
        etapas_ia: data.etapas,
        horas_estimadas_ia: data.horasEstimadas,
        alertas_seguranca_ia: data.alertasSeguranca,
        observacoes_ia: data.observacoes,
      })
      .eq('id', data.projetoId)
    if (error) throw new Error(error.message)
  })

const precoSchema = z.object({
  faixa_min: z.number(),
  faixa_max: z.number(),
  justificativa: z.string(),
})

export interface SugestaoPreco {
  faixaMin: number
  faixaMax: number
  justificativa: string
}

const sugerirPrecoSchema = z.object({ projetoId: z.string().uuid() })

export const sugerirPreco = createServerFn({ method: 'POST' })
  .validator(sugerirPrecoSchema)
  .handler(async ({ data }): Promise<SugestaoPreco> => {
    const supabase = getSupabaseServerClient()

    const [{ data: projeto, error: projetoError }, { data: materiais, error: materiaisError }, { data: registros, error: registrosError }] =
      await Promise.all([
        supabase
          .from('projetos')
          .select('tipo, horas_estimadas_ia')
          .eq('id', data.projetoId)
          .single(),
        supabase.from('projeto_materiais').select('custo').eq('projeto_id', data.projetoId),
        supabase
          .from('registros_ponto')
          .select('inicio, fim')
          .eq('projeto_id', data.projetoId)
          .not('fim', 'is', null),
      ])
    if (projetoError) throw new Error('Projeto não encontrado.')
    if (materiaisError) throw new Error(materiaisError.message)
    if (registrosError) throw new Error(registrosError.message)

    const custoMaterial = materiais.reduce((sum, m) => sum + (m.custo ?? 0), 0)
    const horasRegistradas = registros.reduce((sum, r) => {
      if (!r.fim) return sum
      return sum + (new Date(r.fim).getTime() - new Date(r.inicio).getTime()) / 3_600_000
    }, 0)
    const horasEstimadas = projeto.horas_estimadas_ia ?? (horasRegistradas || null)

    const prompt = `Sugira uma faixa de preço pra esse serviço em Anápolis-GO.

Tipo de serviço: ${labelTipoProjeto(projeto.tipo)}
Horas estimadas: ${horasEstimadas != null ? `${horasEstimadas.toFixed(1)}h` : 'não informado'}
Custo de material: R$ ${custoMaterial.toFixed(2)}

Considere também o desgaste das minhas ferramentas no preço.

Responda SOMENTE com um JSON válido (sem cercas de markdown, sem texto antes ou depois), no formato exato:
{
  "faixa_min": 0,
  "faixa_max": 0,
  "justificativa": ""
}`

    const resposta = await chamarClaude({ prompt, maxTokens: 2000 })

    let json: unknown
    try {
      json = JSON.parse(limparCercasJson(resposta))
    } catch {
      throw new Error('A IA respondeu num formato inesperado. Tenta de novo.')
    }

    const parseResult = precoSchema.safeParse(json)
    if (!parseResult.success) {
      throw new Error('A IA respondeu num formato inesperado. Tenta de novo.')
    }

    return {
      faixaMin: parseResult.data.faixa_min,
      faixaMax: parseResult.data.faixa_max,
      justificativa: parseResult.data.justificativa,
    }
  })
