import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { iniciarPonto, pararPonto  } from '#/lib/server/ponto'
import type {PontoAtivo} from '#/lib/server/ponto';
import type { ServicoAgendado } from '#/lib/server/servicos-agendados'

function formatarDuracao(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000))
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60
  return [horas, minutos, segundos].map((n) => String(n).padStart(2, '0')).join(':')
}

export function PontoWidget({
  servicoHoje,
  pontoAtivo,
}: {
  servicoHoje: ServicoAgendado | undefined
  pontoAtivo: PontoAtivo | null | undefined
}) {
  const queryClient = useQueryClient()
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    if (!pontoAtivo) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [pontoAtivo])

  const iniciarMutation = useMutation({
    mutationFn: (projetoId: string) => iniciarPonto({ data: { projetoId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ponto-ativo'] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const pararMutation = useMutation({
    mutationFn: () => pararPonto(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ponto-ativo'] }),
    onError: (error: Error) => toast.error(error.message),
  })

  if (pontoAtivo) {
    const decorrido = agora - new Date(pontoAtivo.inicio).getTime()
    return (
      <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Cronômetro rodando</p>
          <p className="font-mono text-lg font-semibold">{formatarDuracao(decorrido)}</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => pararMutation.mutate()}
          disabled={pararMutation.isPending}
        >
          <Square className="size-4" />
          Parar
        </Button>
      </div>
    )
  }

  if (!servicoHoje) return null

  return (
    <Button
      className="w-full"
      onClick={() => iniciarMutation.mutate(servicoHoje.id)}
      disabled={iniciarMutation.isPending}
    >
      <Play className="size-4" />
      Iniciar ponto — {servicoHoje.titulo}
    </Button>
  )
}
