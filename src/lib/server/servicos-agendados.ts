import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { TIPOS_PROJETO } from '#/lib/projeto-tipos'

export interface ServicoAgendado {
  id: string
  titulo: string
  tipo: string
  status: string
  dataAgendada: string
  horaInicioAgendada: string | null
  horaFimAgendada: string | null
}

const listarServicosSchema = z.object({
  deISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const listarServicosAgendados = createServerFn({ method: 'GET' })
  .validator(listarServicosSchema)
  .handler(async ({ data }): Promise<Array<ServicoAgendado>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('projetos')
      .select('id, titulo, tipo, status, data_agendada, hora_inicio_agendada, hora_fim_agendada')
      .gte('data_agendada', data.deISO)
      .lte('data_agendada', data.ateISO)
      .not('data_agendada', 'is', null)
      .order('data_agendada', { ascending: true })
    if (error) throw new Error(error.message)

    return rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      tipo: row.tipo,
      status: row.status,
      dataAgendada: row.data_agendada as string,
      horaInicioAgendada: row.hora_inicio_agendada,
      horaFimAgendada: row.hora_fim_agendada,
    }))
  })

const criarServicoAgendadoSchema = z.object({
  titulo: z.string().trim().min(1, 'Informe um título.'),
  tipo: z.enum(TIPOS_PROJETO.map((t) => t.value) as [string, ...Array<string>]),
  dataAgendada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicioAgendada: z.string().nullable(),
  horaFimAgendada: z.string().nullable(),
})

export const criarServicoAgendado = createServerFn({ method: 'POST' })
  .validator(criarServicoAgendadoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('projetos').insert({
      user_id: auth.user.id,
      titulo: data.titulo,
      tipo: data.tipo,
      status: 'agendado',
      data_agendada: data.dataAgendada,
      hora_inicio_agendada: data.horaInicioAgendada,
      hora_fim_agendada: data.horaFimAgendada,
    })
    if (error) throw new Error(error.message)
  })
