import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { FERRAMENTAS_SEED } from '#/lib/ferramentas-seed'

export interface Ferramenta {
  id: string
  nome: string
  categoria: string | null
  fase: 1 | 2 | 3
  status: 'quero_comprar' | 'comprada'
  precoEstimado: number | null
  precoPago: number | null
  dataCompra: string | null
  ondeComprei: string | null
  condicao: 'nova' | 'usada' | null
  observacao: string | null
}

function mapRow(row: Record<string, unknown>): Ferramenta {
  return {
    id: row.id as string,
    nome: row.nome as string,
    categoria: row.categoria as string | null,
    fase: row.fase as 1 | 2 | 3,
    status: row.status as Ferramenta['status'],
    precoEstimado: row.preco_estimado as number | null,
    precoPago: row.preco_pago as number | null,
    dataCompra: row.data_compra as string | null,
    ondeComprei: row.onde_comprei as string | null,
    condicao: row.condicao as Ferramenta['condicao'],
    observacao: row.observacao as string | null,
  }
}

export const listarFerramentas = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Ferramenta>> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('ferramentas')
      .select('*')
      .order('fase', { ascending: true })
      .order('nome', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map(mapRow)
  },
)

const ferramentaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um nome.'),
  categoria: z.string().trim().nullable(),
  fase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  precoEstimado: z.number().nullable(),
  ondeComprei: z.string().trim().nullable(),
  condicao: z.enum(['nova', 'usada']).nullable(),
  observacao: z.string().trim().nullable(),
})

export const criarFerramenta = createServerFn({ method: 'POST' })
  .validator(ferramentaSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('ferramentas').insert({
      user_id: auth.user.id,
      nome: data.nome,
      categoria: data.categoria,
      fase: data.fase,
      status: 'quero_comprar',
      preco_estimado: data.precoEstimado,
      onde_comprei: data.ondeComprei,
      condicao: data.condicao,
      observacao: data.observacao,
    })
    if (error) throw new Error(error.message)
  })

const atualizarFerramentaSchema = ferramentaSchema.extend({ id: z.string().uuid() })

export const atualizarFerramenta = createServerFn({ method: 'POST' })
  .validator(atualizarFerramentaSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('ferramentas')
      .update({
        nome: data.nome,
        categoria: data.categoria,
        fase: data.fase,
        preco_estimado: data.precoEstimado,
        onde_comprei: data.ondeComprei,
        condicao: data.condicao,
        observacao: data.observacao,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const marcarCompradaSchema = z.object({
  id: z.string().uuid(),
  precoPago: z.number(),
  dataCompra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ondeComprei: z.string().trim().nullable(),
  condicao: z.enum(['nova', 'usada']).nullable(),
})

export const marcarComprada = createServerFn({ method: 'POST' })
  .validator(marcarCompradaSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('ferramentas')
      .update({
        status: 'comprada',
        preco_pago: data.precoPago,
        data_compra: data.dataCompra,
        onde_comprei: data.ondeComprei,
        condicao: data.condicao,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const desfazerCompraSchema = z.object({ id: z.string().uuid() })

export const desfazerCompra = createServerFn({ method: 'POST' })
  .validator(desfazerCompraSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('ferramentas')
      .update({ status: 'quero_comprar', preco_pago: null, data_compra: null })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const excluirFerramentaSchema = z.object({ id: z.string().uuid() })

export const excluirFerramenta = createServerFn({ method: 'POST' })
  .validator(excluirFerramentaSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('ferramentas').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const seedFerramentas = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error('Não autenticado.')

  const { error } = await supabase.from('ferramentas').insert(
    FERRAMENTAS_SEED.map((item) => ({
      user_id: auth.user.id,
      nome: item.nome,
      fase: item.fase,
      status: 'quero_comprar' as const,
      preco_estimado: item.precoEstimado,
    })),
  )
  if (error) throw new Error(error.message)
})
