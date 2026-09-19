export function extrairAreaM2(...textos: Array<string | null>): number | null {
  const texto = textos.filter(Boolean).join(' ')
  if (!texto) return null

  const direto = texto.match(/(\d+(?:[.,]\d+)?)\s*m²/i)
  if (direto) return parseFloat(direto[1].replace(',', '.'))

  const dimensoes = texto.match(/(\d+(?:[.,]\d+)?)\s*m\s*x\s*(\d+(?:[.,]\d+)?)\s*m\b/i)
  if (dimensoes) {
    const a = parseFloat(dimensoes[1].replace(',', '.'))
    const b = parseFloat(dimensoes[2].replace(',', '.'))
    return Math.round(a * b * 100) / 100
  }

  return null
}
