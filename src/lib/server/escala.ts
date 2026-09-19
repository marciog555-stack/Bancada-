import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export const getConfiguracaoEscala = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ dataPlantaoReferencia: string } | null> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('configuracoes_escala')
      .select('data_plantao_referencia')
      .maybeSingle()
    if (error || !data) return null
    return { dataPlantaoReferencia: data.data_plantao_referencia }
  },
)

const salvarConfiguracaoEscalaSchema = z.object({
  dataPlantaoReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const salvarConfiguracaoEscala = createServerFn({ method: 'POST' })
  .validator(salvarConfiguracaoEscalaSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('configuracoes_escala').upsert({
      user_id: auth.user.id,
      data_plantao_referencia: data.dataPlantaoReferencia,
    })
    if (error) throw new Error(error.message)
  })
