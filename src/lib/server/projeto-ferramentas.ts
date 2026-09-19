import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export interface FerramentaVinculada {
  vinculoId: string
  ferramentaId: string
  nome: string
  essencial: boolean
  tenho: boolean
  precoEstimado: number | null
}

const listarSchema = z.object({ projetoId: z.string().uuid() })

export const listarFerramentasDoProjeto = createServerFn({ method: 'GET' })
  .validator(listarSchema)
  .handler(async ({ data }): Promise<Array<FerramentaVinculada>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('projeto_ferramentas')
      .select('id, essencial, ferramenta_id, ferramentas(nome, status, preco_estimado)')
      .eq('projeto_id', data.projetoId)
    if (error) throw new Error(error.message)

    return rows.map((row) => {
      const ferramenta = row.ferramentas as unknown as {
        nome: string
        status: string
        preco_estimado: number | null
      }
      return {
        vinculoId: row.id as string,
        ferramentaId: row.ferramenta_id as string,
        nome: ferramenta.nome,
        essencial: row.essencial as boolean,
        tenho: ferramenta.status === 'comprada',
        precoEstimado: ferramenta.preco_estimado,
      }
    })
  })

const vincularSchema = z.object({
  projetoId: z.string().uuid(),
  ferramentaId: z.string().uuid(),
  essencial: z.boolean(),
})

export const vincularFerramenta = createServerFn({ method: 'POST' })
  .validator(vincularSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('projeto_ferramentas').insert({
      user_id: auth.user.id,
      projeto_id: data.projetoId,
      ferramenta_id: data.ferramentaId,
      essencial: data.essencial,
    })
    if (error) throw new Error(error.message)
  })

const desvincularSchema = z.object({ vinculoId: z.string().uuid() })

export const desvincularFerramenta = createServerFn({ method: 'POST' })
  .validator(desvincularSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('projeto_ferramentas')
      .delete()
      .eq('id', data.vinculoId)
    if (error) throw new Error(error.message)
  })
