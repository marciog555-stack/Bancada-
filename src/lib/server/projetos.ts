import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { TIPOS_PROJETO, STATUS_PROJETO, MATERIAIS_SISTEMA } from '#/lib/projeto-tipos'

export interface Projeto {
  id: string
  clienteId: string | null
  titulo: string
  descricao: string | null
  tipo: string
  status: string
  materialSistema: string | null
  valorCobrado: number | null
  dataPrevista: string | null
  dataAgendada: string | null
  horaInicioAgendada: string | null
  horaFimAgendada: string | null
}

function mapRow(row: Record<string, unknown>): Projeto {
  return {
    id: row.id as string,
    clienteId: row.cliente_id as string | null,
    titulo: row.titulo as string,
    descricao: row.descricao as string | null,
    tipo: row.tipo as string,
    status: row.status as string,
    materialSistema: row.material_sistema as string | null,
    valorCobrado: row.valor_cobrado as number | null,
    dataPrevista: row.data_prevista as string | null,
    dataAgendada: row.data_agendada as string | null,
    horaInicioAgendada: row.hora_inicio_agendada as string | null,
    horaFimAgendada: row.hora_fim_agendada as string | null,
  }
}

export const listarProjetos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Projeto>> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapRow)
  },
)

const obterProjetoSchema = z.object({ id: z.string().uuid() })

export const obterProjeto = createServerFn({ method: 'GET' })
  .validator(obterProjetoSchema)
  .handler(async ({ data }): Promise<Projeto | null> => {
    const supabase = getSupabaseServerClient()
    const { data: row, error } = await supabase
      .from('projetos')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()
    if (error || !row) return null
    return mapRow(row)
  })

const projetoFieldsSchema = z.object({
  titulo: z.string().trim().min(1, 'Informe um título.'),
  descricao: z.string().trim().nullable(),
  tipo: z.enum(TIPOS_PROJETO.map((t) => t.value) as [string, ...Array<string>]),
  status: z.enum(STATUS_PROJETO.map((s) => s.value) as [string, ...Array<string>]),
  materialSistema: z
    .enum(MATERIAIS_SISTEMA.map((m) => m.value) as [string, ...Array<string>])
    .nullable(),
  valorCobrado: z.number().nullable(),
  dataPrevista: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  clienteId: z.string().uuid().nullable(),
})

export const criarProjeto = createServerFn({ method: 'POST' })
  .validator(projetoFieldsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Não autenticado.')

    const { data: row, error } = await supabase
      .from('projetos')
      .insert({
        user_id: auth.user.id,
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        status: data.status,
        material_sistema: data.materialSistema,
        valor_cobrado: data.valorCobrado,
        data_prevista: data.dataPrevista,
        cliente_id: data.clienteId,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { id: row.id as string }
  })

const atualizarProjetoSchema = projetoFieldsSchema.extend({ id: z.string().uuid() })

export const atualizarProjeto = createServerFn({ method: 'POST' })
  .validator(atualizarProjetoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('projetos')
      .update({
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        status: data.status,
        material_sistema: data.materialSistema,
        valor_cobrado: data.valorCobrado,
        data_prevista: data.dataPrevista,
        cliente_id: data.clienteId,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { id: data.id }
  })

const excluirProjetoSchema = z.object({ id: z.string().uuid() })

export const excluirProjeto = createServerFn({ method: 'POST' })
  .validator(excluirProjetoSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('projetos').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })

const MATERIAIS_FORRO_WPC = [
  { nome: 'WPC', quantidade: 16, unidade: 'm²' },
  { nome: 'Metalon galvanizado 20x20 (barras de 6 m)', quantidade: 14, unidade: 'barra' },
  { nome: 'Roda-forro (barras de 6 m)', quantidade: 4, unidade: 'barra' },
  { nome: 'Autobrocante', quantidade: 250, unidade: 'un' },
  { nome: 'Bucha 6 + parafuso 40', quantidade: 40, unidade: 'un' },
  { nome: 'Pendurais', quantidade: 20, unidade: 'ponto' },
]

export const seedProjetoForroWPC = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error('Não autenticado.')

  const { data: projeto, error } = await supabase
    .from('projetos')
    .insert({
      user_id: auth.user.id,
      titulo: 'Forro WPC — cozinha da avó',
      descricao:
        'Cozinha 4,32 m x 3,14 m, pé-direito 2,50 m (medidas ±10 cm). Telhado de fibrocimento sem laje (possível amianto: não furar/cortar telha, fixar só na madeira e paredes). Paredes com cerâmica até a altura do forro. Fiação solta a refazer em conduíte antes de fechar.',
      tipo: 'forro',
      status: 'orcamento',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const { error: materiaisError } = await supabase.from('projeto_materiais').insert(
    MATERIAIS_FORRO_WPC.map((item) => ({
      user_id: auth.user.id,
      projeto_id: projeto.id as string,
      nome: item.nome,
      quantidade: item.quantidade,
      unidade: item.unidade,
    })),
  )
  if (materiaisError) throw new Error(materiaisError.message)

  return { id: projeto.id as string }
})
