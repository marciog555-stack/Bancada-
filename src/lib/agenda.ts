export type TipoDia = 'plantao' | 'pos_plantao'

export interface JanelaDia {
  tipo: TipoDia
  fimDeSemana: boolean
  janelaInicio: string | null
  janelaFim: string | null
  disponivelParaServico: boolean
  treinoDisponivel: boolean
}

const JANELA_INICIO_PLANTAO = '07:30'
const JANELA_FIM_PLANTAO_SEMANA = '11:00'
const JANELA_FIM_PLANTAO_FIM_DE_SEMANA = '13:00'
const ENTRADA_PLANTAO = '17:40'
const SAIDA_PLANTAO = '05:40'
const ACADEMIA_INICIO = '06:00'
const ACADEMIA_FIM = '07:00'
const BUSCA_MAITE = '11:15'
const BUSCA_MIGUEL = '16:00'

export function parseDataISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function formatDataISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function diasEntre(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / msPerDay)
}

export function getTipoDia(dataISO: string, referenciaISO: string): TipoDia {
  const diff = diasEntre(parseDataISO(referenciaISO), parseDataISO(dataISO))
  const offset = ((diff % 2) + 2) % 2
  return offset === 0 ? 'plantao' : 'pos_plantao'
}

export function isFimDeSemana(dataISO: string): boolean {
  const dow = parseDataISO(dataISO).getDay()
  return dow === 0 || dow === 6
}

export function getJanelaDia(dataISO: string, referenciaISO: string): JanelaDia {
  const tipo = getTipoDia(dataISO, referenciaISO)
  const fimDeSemana = isFimDeSemana(dataISO)

  if (tipo === 'pos_plantao') {
    return {
      tipo,
      fimDeSemana,
      janelaInicio: null,
      janelaFim: null,
      disponivelParaServico: false,
      treinoDisponivel: true,
    }
  }

  return {
    tipo,
    fimDeSemana,
    janelaInicio: JANELA_INICIO_PLANTAO,
    janelaFim: fimDeSemana ? JANELA_FIM_PLANTAO_FIM_DE_SEMANA : JANELA_FIM_PLANTAO_SEMANA,
    disponivelParaServico: true,
    treinoDisponivel: false,
  }
}

export const HORARIOS_FIXOS = {
  entradaPlantao: ENTRADA_PLANTAO,
  saidaPlantao: SAIDA_PLANTAO,
  academiaInicio: ACADEMIA_INICIO,
  academiaFim: ACADEMIA_FIM,
  buscaMaite: BUSCA_MAITE,
  buscaMiguel: BUSCA_MIGUEL,
} as const

export function hojeISO(): string {
  return formatDataISO(new Date())
}

export function addDias(dataISO: string, dias: number): string {
  const date = parseDataISO(dataISO)
  date.setDate(date.getDate() + dias)
  return formatDataISO(date)
}

const DIAS_SEMANA_LABEL = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export function labelDiaSemana(dataISO: string): string {
  return DIAS_SEMANA_LABEL[parseDataISO(dataISO).getDay()]
}

export function labelDataCurta(dataISO: string): string {
  const date = parseDataISO(dataISO)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function getSemana(dataISO: string): Array<string> {
  return Array.from({ length: 7 }, (_, i) => addDias(dataISO, i))
}
