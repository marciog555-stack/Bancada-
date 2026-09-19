export interface FerramentaSeed {
  nome: string
  fase: 1 | 2 | 3
  precoEstimado: number
}

export const FERRAMENTAS_SEED: Array<FerramentaSeed> = [
  { nome: 'Furadeira de impacto', fase: 1, precoEstimado: 280 },
  { nome: 'Parafusadeira a bateria', fase: 1, precoEstimado: 350 },
  { nome: 'Nível a laser', fase: 1, precoEstimado: 280 },
  { nome: 'Trena 5 m', fase: 1, precoEstimado: 30 },
  { nome: 'Nível de bolha', fase: 1, precoEstimado: 40 },
  { nome: 'Esquadro', fase: 1, precoEstimado: 30 },
  { nome: 'Estilete + lápis', fase: 1, precoEstimado: 20 },
  { nome: 'Escada de alumínio 5–6 degraus', fase: 1, precoEstimado: 320 },
  { nome: 'Esmerilhadeira com disco de corte', fase: 1, precoEstimado: 200 },
  { nome: 'Broca para cerâmica/porcelanato', fase: 1, precoEstimado: 40 },
  {
    nome: 'EPI: óculos, luvas, protetor auricular, máscara PFF2',
    fase: 1,
    precoEstimado: 80,
  },
  { nome: 'Serra tico-tico', fase: 2, precoEstimado: 320 },
  { nome: 'Jogo de brocas e bits', fase: 2, precoEstimado: 80 },
  { nome: 'Alicates universal e de corte', fase: 2, precoEstimado: 70 },
  { nome: 'Jogo de chaves fenda/Phillips', fase: 2, precoEstimado: 50 },
  { nome: 'Multímetro', fase: 3, precoEstimado: 80 },
  { nome: 'Chave de teste', fase: 3, precoEstimado: 15 },
  { nome: 'Alicate amperímetro', fase: 3, precoEstimado: 120 },
  { nome: 'Chave inglesa', fase: 3, precoEstimado: 50 },
  { nome: 'Chave de grifo', fase: 3, precoEstimado: 60 },
  { nome: 'Martelo', fase: 3, precoEstimado: 40 },
]
