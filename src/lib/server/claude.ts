import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-5'

export const SYSTEM_PROMPT_BANCADA =
  'Você é o assistente de um profissional de reparos residenciais iniciante em ' +
  'Anápolis-GO (faz-tudo / marido de aluguel). Use linguagem simples e direta, ' +
  'sem jargão técnico desnecessário. Segurança em primeiro lugar: sempre alerte ' +
  'sobre riscos de elétrica, trabalho em altura e telhados de fibrocimento com ' +
  'possível amianto (nunca cortar ou furar a telha nesses casos). Seja objetivo.'

export async function chamarClaude({
  prompt,
  maxTokens = 1500,
  system = SYSTEM_PROMPT_BANCADA,
}: {
  prompt: string
  maxTokens?: number
  system?: string
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'A IA ainda não está configurada neste ambiente (falta a chave ANTHROPIC_API_KEY).',
    )
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    })
    const bloco = message.content.find((b) => b.type === 'text')
    if (!bloco) {
      throw new Error('A IA respondeu num formato inesperado.')
    }
    return bloco.text
  } catch (error) {
    if (error instanceof Error && error.message === 'A IA respondeu num formato inesperado.') {
      throw error
    }
    throw new Error('Não consegui falar com a IA agora. Tenta de novo em instantes.')
  }
}

export function limparCercasJson(texto: string): string {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}
