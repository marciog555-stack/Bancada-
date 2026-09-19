import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase/server'
import { addDias, hojeISO } from '#/lib/agenda'

export type Previsao =
  | { tipo: 'insuficiente' }
  | { tipo: 'positivo' }
  | { tipo: 'sem_tendencia' }
  | { tipo: 'estimativa'; diasParaEmpatar: number; dataEstimadaISO: string }

export interface ResumoFinanceiro {
  totalInvestidoFerramentas: number
  totalRecebido: number
  totalGastoMateriais: number
  lucroAcumulado: number
  saldoNegocio: number
  faltaEmpatar: number
  valorMedioHora: number | null
  previsao: Previsao
  serieSaldo: Array<{ dataISO: string; saldo: number }>
}

export const obterResumoFinanceiro = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ResumoFinanceiro> => {
    const supabase = getSupabaseServerClient()

    const [ferramentasRes, pagamentosRes, materiaisRes, pontoRes, projetosConcluidosRes] =
      await Promise.all([
        supabase
          .from('ferramentas')
          .select('preco_pago, data_compra')
          .eq('status', 'comprada'),
        supabase.from('pagamentos').select('valor, data, projeto_id'),
        supabase.from('projeto_materiais').select('custo, created_at, projeto_id'),
        supabase.from('registros_ponto').select('inicio, fim').not('fim', 'is', null),
        supabase.from('projetos').select('id, updated_at').eq('status', 'concluido'),
      ])

    if (ferramentasRes.error) throw new Error(ferramentasRes.error.message)
    if (pagamentosRes.error) throw new Error(pagamentosRes.error.message)
    if (materiaisRes.error) throw new Error(materiaisRes.error.message)
    if (pontoRes.error) throw new Error(pontoRes.error.message)
    if (projetosConcluidosRes.error) throw new Error(projetosConcluidosRes.error.message)

    const ferramentas = ferramentasRes.data
    const pagamentos = pagamentosRes.data
    const materiais = materiaisRes.data
    const registros = pontoRes.data
    const projetosConcluidos = projetosConcluidosRes.data

    const totalInvestidoFerramentas = ferramentas.reduce(
      (sum, f) => sum + (f.preco_pago ?? 0),
      0,
    )
    const totalRecebido = pagamentos.reduce((sum, p) => sum + p.valor, 0)
    const totalGastoMateriais = materiais.reduce((sum, m) => sum + (m.custo ?? 0), 0)
    const lucroAcumulado = totalRecebido - totalGastoMateriais
    const saldoNegocio = lucroAcumulado - totalInvestidoFerramentas
    const faltaEmpatar = saldoNegocio < 0 ? -saldoNegocio : 0

    const horasTotais = registros.reduce((sum, r) => {
      if (!r.fim) return sum
      return sum + (new Date(r.fim).getTime() - new Date(r.inicio).getTime()) / 3_600_000
    }, 0)
    const valorMedioHora = horasTotais > 0 ? lucroAcumulado / horasTotais : null

    const previsao = calcularPrevisao({
      projetosConcluidos,
      saldoNegocio,
      faltaEmpatar,
      pagamentos,
      materiais,
    })

    const serieSaldo = calcularSerieSaldo({ pagamentos, materiais, ferramentas })

    return {
      totalInvestidoFerramentas,
      totalRecebido,
      totalGastoMateriais,
      lucroAcumulado,
      saldoNegocio,
      faltaEmpatar,
      valorMedioHora,
      previsao,
      serieSaldo,
    }
  },
)

function calcularPrevisao(args: {
  projetosConcluidos: Array<{ id: string; updated_at: string }>
  saldoNegocio: number
  faltaEmpatar: number
  pagamentos: Array<{ valor: number; projeto_id: string }>
  materiais: Array<{ custo: number | null; projeto_id: string }>
}): Previsao {
  const { projetosConcluidos, saldoNegocio, faltaEmpatar, pagamentos, materiais } = args

  if (projetosConcluidos.length < 2) return { tipo: 'insuficiente' }
  if (saldoNegocio >= 0) return { tipo: 'positivo' }

  const limiteJanela = addDias(hojeISO(), -60)
  const idsRecentes = new Set(
    projetosConcluidos
      .filter((p) => p.updated_at.slice(0, 10) >= limiteJanela)
      .map((p) => p.id),
  )

  const lucroJanela =
    pagamentos
      .filter((p) => idsRecentes.has(p.projeto_id))
      .reduce((sum, p) => sum + p.valor, 0) -
    materiais
      .filter((m) => idsRecentes.has(m.projeto_id))
      .reduce((sum, m) => sum + (m.custo ?? 0), 0)

  const mediaLucroDiario = lucroJanela / 60
  if (mediaLucroDiario <= 0) return { tipo: 'sem_tendencia' }

  const diasParaEmpatar = Math.ceil(faltaEmpatar / mediaLucroDiario)
  return {
    tipo: 'estimativa',
    diasParaEmpatar,
    dataEstimadaISO: addDias(hojeISO(), diasParaEmpatar),
  }
}

function calcularSerieSaldo(args: {
  pagamentos: Array<{ valor: number; data: string }>
  materiais: Array<{ custo: number | null; created_at: string }>
  ferramentas: Array<{ preco_pago: number | null; data_compra: string | null }>
}): Array<{ dataISO: string; saldo: number }> {
  const { pagamentos, materiais, ferramentas } = args

  const eventos: Array<{ dataISO: string; delta: number }> = []
  for (const p of pagamentos) eventos.push({ dataISO: p.data, delta: p.valor })
  for (const m of materiais) {
    if (m.custo) eventos.push({ dataISO: m.created_at.slice(0, 10), delta: -m.custo })
  }
  for (const f of ferramentas) {
    if (f.preco_pago && f.data_compra) {
      eventos.push({ dataISO: f.data_compra, delta: -f.preco_pago })
    }
  }

  eventos.sort((a, b) => a.dataISO.localeCompare(b.dataISO))

  const porData = new Map<string, number>()
  for (const e of eventos) {
    porData.set(e.dataISO, (porData.get(e.dataISO) ?? 0) + e.delta)
  }

  let acumulado = 0
  return [...porData.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dataISO, delta]) => {
      acumulado += delta
      return { dataISO, saldo: acumulado }
    })
}
