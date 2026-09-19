import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { chamarClaude, limparCercasJson } from '#/lib/server/claude'
import { saoSemelhantes } from '#/lib/similaridade'
import { labelMaterialSistema, labelTipoProjeto } from '#/lib/projeto-tipos'
import { extrairAreaM2 } from '#/lib/area'

async function buscarModeloServico(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  tipo: string,
  materialSistema: string | null,
): Promise<{ titulo: string; instrucoes: string } | null> {
  if (materialSistema) {
    const { data } = await supabase
      .from('modelos_servico')
      .select('titulo, instrucoes')
      .eq('tipo', tipo)
      .eq('material_sistema', materialSistema)
      .limit(1)
      .maybeSingle()
    if (data) return data
  }

  const { data: generico } = await supabase
    .from('modelos_servico')
    .select('titulo, instrucoes')
    .eq('tipo', tipo)
    .is('material_sistema', null)
    .limit(1)
    .maybeSingle()

  return generico ?? null
}

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
          .select('titulo, descricao, tipo, material_sistema')
          .eq('id', data.projetoId)
          .single(),
        supabase.from('ferramentas').select('id, nome, status'),
      ])
    if (projetoError) throw new Error('Projeto não encontrado.')
    if (ferramentasError) throw new Error(ferramentasError.message)

    const modelo = await buscarModeloServico(supabase, projeto.tipo, projeto.material_sistema)

    const listaFerramentas = ferramentas
      .map((f) => `- ${f.nome} (${f.status === 'comprada' ? 'já tenho' : 'quero comprar'})`)
      .join('\n')

    const blocoModelo = modelo
      ? `Modelo cadastrado pra esse tipo de serviço/material — siga essas instruções à risca (é o jeito que eu faço):
"${modelo.titulo}"
${modelo.instrucoes}`
      : 'Não há nenhum modelo cadastrado pra esse tipo de serviço/material. Use seu conhecimento geral, mas deixe isso claro no campo "observacoes" (que estou usando um método genérico, sem modelo específico).'

    const prompt = `Planeje o serviço abaixo pra mim.

Título: ${projeto.titulo}
Tipo: ${labelTipoProjeto(projeto.tipo)}
Material do sistema: ${projeto.material_sistema ? labelMaterialSistema(projeto.material_sistema) : 'não informado'}
Descrição: ${projeto.descricao ?? '(sem descrição)'}

${blocoModelo}

Minhas ferramentas cadastradas:
${listaFerramentas || '(nenhuma cadastrada ainda)'}

Ao sugerir ferramentas, priorize as que eu já tenho ou já pretendo comprar (estão na
lista acima) antes de sugerir ferramentas novas que não estão cadastradas.

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
  preco_por_m2: z.number().nullable(),
  justificativa: z.string(),
  dados_faltando: z.array(z.string()),
})

export interface SugestaoPreco {
  faixaMin: number
  faixaMax: number
  precoPorM2: number | null
  justificativa: string
  dadosFaltando: Array<string>
  custoMaterialZerado: boolean
}

const sugerirPrecoSchema = z.object({ projetoId: z.string().uuid() })

export const sugerirPreco = createServerFn({ method: 'POST' })
  .validator(sugerirPrecoSchema)
  .handler(async ({ data }): Promise<SugestaoPreco> => {
    const supabase = getSupabaseServerClient()

    const [
      { data: projeto, error: projetoError },
      { data: materiais, error: materiaisError },
      { data: registros, error: registrosError },
    ] = await Promise.all([
      supabase
        .from('projetos')
        .select('titulo, descricao, tipo, horas_estimadas_ia')
        .eq('id', data.projetoId)
        .single(),
      supabase
        .from('projeto_materiais')
        .select('nome, quantidade, unidade, custo')
        .eq('projeto_id', data.projetoId),
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
    const custoMaterialZerado = custoMaterial === 0
    const horasRegistradas = registros.reduce((sum, r) => {
      if (!r.fim) return sum
      return sum + (new Date(r.fim).getTime() - new Date(r.inicio).getTime()) / 3_600_000
    }, 0)
    const horasEstimadas = projeto.horas_estimadas_ia ?? (horasRegistradas || null)
    const areaM2 = extrairAreaM2(projeto.titulo, projeto.descricao)

    const listaMateriais = materiais
      .map(
        (m) =>
          `- ${m.nome}${m.quantidade != null ? ` (${m.quantidade} ${m.unidade ?? ''})` : ''}: ${
            m.custo != null ? `R$ ${m.custo.toFixed(2)}` : 'custo não informado'
          }`,
      )
      .join('\n')

    const prompt = `Sugira uma faixa de preço pra esse serviço em Anápolis-GO.

Título: ${projeto.titulo}
Tipo de serviço: ${labelTipoProjeto(projeto.tipo)}
Descrição: ${projeto.descricao ?? '(sem descrição)'}
Área: ${areaM2 != null ? `${areaM2} m²` : 'não informada'}
Horas estimadas: ${horasEstimadas != null ? `${horasEstimadas.toFixed(1)}h` : 'não informado'}

Materiais lançados:
${listaMateriais || '(nenhum material lançado ainda)'}
Custo total de material: R$ ${custoMaterial.toFixed(2)}

Considere o material específico citado no título/descrição pra ajustar o preço e a
justificativa (por exemplo, forro de WPC é mais caro e mais trabalhoso de instalar
que forro de PVC). Considere também o desgaste das minhas ferramentas no preço.

Se for um serviço de forro e a área for conhecida, sugira também um preço por m²
(campo "preco_por_m2"); senão deixe esse campo null.

Se o custo de material lançado for zero ou não informado, deixe claro na
justificativa que a faixa sugerida cobre só mão de obra, sem material.

Liste em "dados_faltando" as informações que, se eu informasse, deixariam a
estimativa mais precisa (ex.: área, custo de material, horas trabalhadas).

Responda SOMENTE com um JSON válido (sem cercas de markdown, sem texto antes ou depois), no formato exato:
{
  "faixa_min": 0,
  "faixa_max": 0,
  "preco_por_m2": null,
  "justificativa": "",
  "dados_faltando": [""]
}`

    const resposta = await chamarClaude({ prompt, maxTokens: 3000 })

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
      precoPorM2: parseResult.data.preco_por_m2,
      justificativa: parseResult.data.justificativa,
      dadosFaltando: parseResult.data.dados_faltando,
      custoMaterialZerado,
    }
  })
