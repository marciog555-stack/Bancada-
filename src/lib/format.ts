const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRL(valor: number | null | undefined): string {
  return currencyFormatter.format(valor ?? 0)
}
