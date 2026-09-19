import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export interface PontoAtivo {
  id: string
  projetoId: string
  inicio: string
}

export const getPontoAtivo = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PontoAtivo | null> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('registros_ponto')
      .select('id, projeto_id, inicio')
      .is('fim', null)
      .maybeSingle()
    if (error || !data) return null
    return { id: data.id, projetoId: data.projeto_id, inicio: data.inicio }
  },
)

const iniciarPontoSchema = z.object({ projetoId: z.string().uuid() })

export const iniciarPonto = createServerFn({ method: 'POST' })
  .validator(iniciarPontoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('registros_ponto').insert({
      user_id: auth.user.id,
      projeto_id: data.projetoId,
      inicio: new Date().toISOString(),
      origem: 'cronometro',
    })
    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe um cronômetro em andamento.')
      }
      throw new Error(error.message)
    }
  })

export const pararPonto = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('registros_ponto')
    .update({ fim: new Date().toISOString() })
    .is('fim', null)
  if (error) throw new Error(error.message)
})
