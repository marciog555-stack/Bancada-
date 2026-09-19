import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

const listarTreinosSchema = z.object({
  datasISO: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
})

export const listarTreinos = createServerFn({ method: 'GET' })
  .validator(listarTreinosSchema)
  .handler(async ({ data }): Promise<Record<string, boolean>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('registros_treino')
      .select('data, treinou')
      .in('data', data.datasISO)
    if (error) throw new Error(error.message)

    return Object.fromEntries(rows.map((row) => [row.data, row.treinou]))
  })

const definirTreinoSchema = z.object({
  dataISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  treinou: z.boolean(),
})

export const definirTreino = createServerFn({ method: 'POST' })
  .validator(definirTreinoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('registros_treino').upsert(
      {
        user_id: auth.user.id,
        data: data.dataISO,
        treinou: data.treinou,
      },
      { onConflict: 'user_id,data' },
    )
    if (error) throw new Error(error.message)
  })
