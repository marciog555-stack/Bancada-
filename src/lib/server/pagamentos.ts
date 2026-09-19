import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'

export interface Pagamento {
  id: string
  valor: number
  data: string
  forma: 'pix' | 'dinheiro' | 'cartao'
}

function mapRow(row: Record<string, unknown>): Pagamento {
  return {
    id: row.id as string,
    valor: row.valor as number,
    data: row.data as string,
    forma: row.forma as Pagamento['forma'],
  }
}

const listarSchema = z.object({ projetoId: z.string().uuid() })

export const listarPagamentos = createServerFn({ method: 'GET' })
  .validator(listarSchema)
  .handler(async ({ data }): Promise<Array<Pagamento>> => {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('projeto_id', data.projetoId)
      .order('data', { ascending: false })
    if (error) throw new Error(error.message)
    return rows.map(mapRow)
  })

const criarPagamentoSchema = z.object({
  projetoId: z.string().uuid(),
  valor: z.number().positive('Informe um valor.'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  forma: z.enum(['pix', 'dinheiro', 'cartao']),
})

export const criarPagamento = createServerFn({ method: 'POST' })
  .validator(criarPagamentoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { error } = await supabase.from('pagamentos').insert({
      user_id: auth.user.id,
      projeto_id: data.projetoId,
      valor: data.valor,
      data: data.data,
      forma: data.forma,
    })
    if (error) throw new Error(error.message)
  })

const excluirSchema = z.object({ id: z.string().uuid() })

export const excluirPagamento = createServerFn({ method: 'POST' })
  .validator(excluirSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('pagamentos').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })
