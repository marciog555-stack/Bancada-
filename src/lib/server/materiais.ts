import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export interface Material {
  id: string
  nome: string
  quantidade: number | null
  unidade: string | null
  custo: number | null
}

function mapRow(row: Record<string, unknown>): Material {
  return {
    id: row.id as string,
    nome: row.nome as string,
    quantidade: row.quantidade as number | null,
    unidade: row.unidade as string | null,
    custo: row.custo as number | null,
  }
}

const listarSchema = z.object({ projetoId: z.string().uuid() })

export const listarMateriais = createServerFn({ method: 'GET' })
  .validator(listarSchema)
  .handler(async ({ data }): Promise<Array<Material>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('projeto_materiais')
      .select('*')
      .eq('projeto_id', data.projetoId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return rows.map(mapRow)
  })

const materialFieldsSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um nome.'),
  quantidade: z.number().nullable(),
  unidade: z.string().trim().nullable(),
  custo: z.number().nullable(),
})

export const criarMaterial = createServerFn({ method: 'POST' })
  .validator(materialFieldsSchema.extend({ projetoId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('projeto_materiais').insert({
      user_id: auth.user.id,
      projeto_id: data.projetoId,
      nome: data.nome,
      quantidade: data.quantidade,
      unidade: data.unidade,
      custo: data.custo,
    })
    if (error) throw new Error(error.message)
  })

export const atualizarMaterial = createServerFn({ method: 'POST' })
  .validator(materialFieldsSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('projeto_materiais')
      .update({
        nome: data.nome,
        quantidade: data.quantidade,
        unidade: data.unidade,
        custo: data.custo,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const excluirSchema = z.object({ id: z.string().uuid() })

export const excluirMaterial = createServerFn({ method: 'POST' })
  .validator(excluirSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('projeto_materiais').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })
