import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { TIPOS_PROJETO, MATERIAIS_SISTEMA } from '#/lib/projeto-tipos'

export interface ModeloServico {
  id: string
  tipo: string
  materialSistema: string | null
  titulo: string
  instrucoes: string
}

function mapRow(row: Record<string, unknown>): ModeloServico {
  return {
    id: row.id as string,
    tipo: row.tipo as string,
    materialSistema: row.material_sistema as string | null,
    titulo: row.titulo as string,
    instrucoes: row.instrucoes as string,
  }
}

export const listarModelos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ModeloServico>> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('modelos_servico')
      .select('*')
      .order('tipo', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map(mapRow)
  },
)

const obterSchema = z.object({ id: z.string().uuid() })

export const obterModelo = createServerFn({ method: 'GET' })
  .validator(obterSchema)
  .handler(async ({ data }): Promise<ModeloServico | null> => {
    const supabase = getSupabaseServerClient()
    const { data: row, error } = await supabase
      .from('modelos_servico')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()
    if (error || !row) return null
    return mapRow(row)
  })

const modeloFieldsSchema = z.object({
  tipo: z.enum(TIPOS_PROJETO.map((t) => t.value) as [string, ...Array<string>]),
  materialSistema: z
    .enum(MATERIAIS_SISTEMA.map((m) => m.value) as [string, ...Array<string>])
    .nullable(),
  titulo: z.string().trim().min(1, 'Informe um título.'),
  instrucoes: z.string().trim().min(1, 'Informe as instruções.'),
})

export const criarModelo = createServerFn({ method: 'POST' })
  .validator(modeloFieldsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('modelos_servico').insert({
      user_id: auth.user.id,
      tipo: data.tipo,
      material_sistema: data.materialSistema,
      titulo: data.titulo,
      instrucoes: data.instrucoes,
    })
    if (error) throw new Error(error.message)
  })

export const atualizarModelo = createServerFn({ method: 'POST' })
  .validator(modeloFieldsSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('modelos_servico')
      .update({
        tipo: data.tipo,
        material_sistema: data.materialSistema,
        titulo: data.titulo,
        instrucoes: data.instrucoes,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const excluirSchema = z.object({ id: z.string().uuid() })

export const excluirModelo = createServerFn({ method: 'POST' })
  .validator(excluirSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('modelos_servico').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })
