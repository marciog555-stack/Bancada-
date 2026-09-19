export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function saoSemelhantes(a: string, b: string): boolean {
  const na = normalizar(a)
  const nb = normalizar(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true

  const primeiraA = na.split(/\s+/)[0]
  const primeiraB = nb.split(/\s+/)[0]
  return primeiraA.length > 3 && primeiraA === primeiraB
}
