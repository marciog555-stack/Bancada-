import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export interface Cliente {
  id: string
  nome: string
  whatsapp: string | null
  bairro: string | null
  observacao: string | null
}

function mapRow(row: Record<string, unknown>): Cliente {
  return {
    id: row.id as string,
    nome: row.nome as string,
    whatsapp: row.whatsapp as string | null,
    bairro: row.bairro as string | null,
    observacao: row.observacao as string | null,
  }
}

export const listarClientes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Cliente>> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map(mapRow)
  },
)

const obterSchema = z.object({ id: z.string().uuid() })

export const obterCliente = createServerFn({ method: 'GET' })
  .validator(obterSchema)
  .handler(async ({ data }): Promise<Cliente | null> => {
    const supabase = getSupabaseServerClient()
    const { data: row, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()
    if (error || !row) return null
    return mapRow(row)
  })

const clienteFieldsSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um nome.'),
  whatsapp: z.string().trim().nullable(),
  bairro: z.string().trim().nullable(),
  observacao: z.string().trim().nullable(),
})

export const criarCliente = createServerFn({ method: 'POST' })
  .validator(clienteFieldsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { data: row, error } = await supabase
      .from('clientes')
      .insert({
        user_id: auth.user.id,
        nome: data.nome,
        whatsapp: data.whatsapp,
        bairro: data.bairro,
        observacao: data.observacao,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { id: row.id as string }
  })

export const atualizarCliente = createServerFn({ method: 'POST' })
  .validator(clienteFieldsSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('clientes')
      .update({
        nome: data.nome,
        whatsapp: data.whatsapp,
        bairro: data.bairro,
        observacao: data.observacao,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { id: data.id }
  })

const excluirSchema = z.object({ id: z.string().uuid() })

export const excluirCliente = createServerFn({ method: 'POST' })
  .validator(excluirSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('clientes').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export interface ProjetoDoCliente {
  id: string
  titulo: string
  status: string
  totalPago: number
}

const projetosDoClienteSchema = z.object({ clienteId: z.string().uuid() })

export const listarProjetosDoCliente = createServerFn({ method: 'GET' })
  .validator(projetosDoClienteSchema)
  .handler(async ({ data }): Promise<Array<ProjetoDoCliente>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('projetos')
      .select('id, titulo, status, pagamentos(valor)')
      .eq('cliente_id', data.clienteId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    return rows.map((row) => {
      const pagamentos = row.pagamentos as unknown as Array<{ valor: number }>
      return {
        id: row.id as string,
        titulo: row.titulo as string,
        status: row.status as string,
        totalPago: pagamentos.reduce((sum, p) => sum + p.valor, 0),
      }
    })
  })
