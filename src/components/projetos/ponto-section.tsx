import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, Plus, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PontoManualDialog } from '#/components/projetos/ponto-manual-dialog'
import {
  excluirRegistroPonto,
  getPontoAtivo,
  iniciarPonto,
  listarRegistrosPonto,
  pararPonto,
} from '#/lib/server/ponto'

function formatarHoras(horas: number): string {
  return horas.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

function formatarDuracaoCronometro(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSegundos / 3600)
  const m = Math.floor((totalSegundos % 3600) / 60)
  const s = totalSegundos % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function PontoSection({ projetoId }: { projetoId: string }) {
  const [manualAberto, setManualAberto] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const queryClient = useQueryClient()

  const pontoAtivoQuery = useQuery({
    queryKey: ['ponto-ativo'],
    queryFn: () => getPontoAtivo(),
  })

  const registrosQuery = useQuery({
    queryKey: ['registros-ponto', projetoId],
    queryFn: () => listarRegistrosPonto({ data: { projetoId } }),
  })

  const ativoAqui = pontoAtivoQuery.data?.projetoId === projetoId

  useEffect(() => {
    if (!ativoAqui) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ativoAqui])

  const invalidarPonto = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ponto-ativo'] })
    await queryClient.invalidateQueries({ queryKey: ['registros-ponto', projetoId] })
  }

  const iniciarMutation = useMutation({
    mutationFn: () => iniciarPonto({ data: { projetoId } }),
    onSuccess: invalidarPonto,
    onError: (error: Error) => toast.error(error.message),
  })

  const pararMutation = useMutation({
    mutationFn: () => pararPonto(),
    onSuccess: invalidarPonto,
    onError: (error: Error) => toast.error(error.message),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirRegistroPonto({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registros-ponto', projetoId] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const registros = registrosQuery.data ?? []
  const totalHoras = registros.reduce((sum, r) => {
    if (!r.fim) return sum
    return sum + (new Date(r.fim).getTime() - new Date(r.inicio).getTime()) / 3_600_000
  }, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ponto</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setManualAberto(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ativoAqui && pontoAtivoQuery.data ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Cronômetro rodando</p>
              <p className="font-mono text-lg font-semibold">
                {formatarDuracaoCronometro(agora - new Date(pontoAtivoQuery.data.inicio).getTime())}
              </p>
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
        ) : pontoAtivoQuery.data ? (
          <p className="text-sm text-muted-foreground">
            Há um cronômetro rodando em outro projeto.
          </p>
        ) : (
          <Button onClick={() => iniciarMutation.mutate()} disabled={iniciarMutation.isPending}>
            <Play className="size-4" />
            Iniciar ponto
          </Button>
        )}

        {registros.length > 0 ? (
          <div className="flex flex-col gap-1">
            {registros.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {new Date(r.inicio).toLocaleDateString('pt-BR')} ·{' '}
                  {new Date(r.inicio).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {r.fim
                    ? `–${new Date(r.fim).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ' (em andamento)'}
                </span>
                <button
                  type="button"
                  aria-label="Excluir registro"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => excluirMutation.mutate(r.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <p className="border-t border-border pt-2 text-sm text-muted-foreground">
          Total de horas: <span className="text-foreground">{formatarHoras(totalHoras)}h</span>
        </p>
      </CardContent>

      <PontoManualDialog
        open={manualAberto}
        onOpenChange={setManualAberto}
        projetoId={projetoId}
      />
    </Card>
  )
}
