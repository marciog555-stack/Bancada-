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

export interface RegistroPonto {
  id: string
  inicio: string
  fim: string | null
  origem: 'cronometro' | 'manual'
}

const listarRegistrosSchema = z.object({ projetoId: z.string().uuid() })

export const listarRegistrosPonto = createServerFn({ method: 'GET' })
  .validator(listarRegistrosSchema)
  .handler(async ({ data }): Promise<Array<RegistroPonto>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('registros_ponto')
      .select('id, inicio, fim, origem')
      .eq('projeto_id', data.projetoId)
      .order('inicio', { ascending: false })
    if (error) throw new Error(error.message)
    return rows
  })

const registrarManualSchema = z.object({
  projetoId: z.string().uuid(),
  inicio: z.string(),
  fim: z.string(),
})

export const registrarPontoManual = createServerFn({ method: 'POST' })
  .validator(registrarManualSchema)
  .handler(async ({ data }) => {
    if (new Date(data.fim) <= new Date(data.inicio)) {
      throw new Error('O fim precisa ser depois do início.')
    }
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('registros_ponto').insert({
      user_id: auth.user.id,
      projeto_id: data.projetoId,
      inicio: data.inicio,
      fim: data.fim,
      origem: 'manual',
    })
    if (error) throw new Error(error.message)
  })

const excluirRegistroSchema = z.object({ id: z.string().uuid() })

export const excluirRegistroPonto = createServerFn({ method: 'POST' })
  .validator(excluirRegistroSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('registros_ponto').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })
