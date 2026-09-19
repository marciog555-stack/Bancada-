export const TIPOS_PROJETO = [
  { value: 'reparo', label: 'Reparo' },
  { value: 'forro', label: 'Forro' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'instalacao', label: 'Instalação' },
  { value: 'outro', label: 'Outro' },
] as const

export type TipoProjeto = (typeof TIPOS_PROJETO)[number]['value']

export const STATUS_PROJETO = [
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
] as const

export type StatusProjeto = (typeof STATUS_PROJETO)[number]['value']

export const MATERIAIS_SISTEMA = [
  { value: 'wpc', label: 'WPC' },
  { value: 'pvc', label: 'PVC' },
  { value: 'gesso', label: 'Gesso' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'outro', label: 'Outro' },
] as const

export type MaterialSistema = (typeof MATERIAIS_SISTEMA)[number]['value']

export function labelTipoProjeto(tipo: string): string {
  return TIPOS_PROJETO.find((t) => t.value === tipo)?.label ?? tipo
}

export function labelStatusProjeto(status: string): string {
  return STATUS_PROJETO.find((s) => s.value === status)?.label ?? status
}

export function labelMaterialSistema(material: string): string {
  return MATERIAIS_SISTEMA.find((m) => m.value === material)?.label ?? material
}
