import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { FerramentaFormDialog } from '#/components/ferramentas/ferramenta-form-dialog'
import { FerramentaItem } from '#/components/ferramentas/ferramenta-item'
import { formatBRL } from '#/lib/format'
import { listarFerramentas, seedFerramentas } from '#/lib/server/ferramentas'

export const Route = createFileRoute('/_authed/ferramentas')({
  component: FerramentasPage,
})

type FiltroStatus = 'todas' | 'quero_comprar' | 'comprada'
type FiltroFase = 'todas' | '1' | '2' | '3'

function FerramentasPage() {
  const queryClient = useQueryClient()
  const [novaAberta, setNovaAberta] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas')
  const [filtroFase, setFiltroFase] = useState<FiltroFase>('todas')

  const ferramentasQuery = useQuery({
    queryKey: ['ferramentas'],
    queryFn: () => listarFerramentas(),
  })

  const seedMutation = useMutation({
    mutationFn: () => seedFerramentas(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success('Lista inicial carregada.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const ferramentas = ferramentasQuery.data ?? []

  const totais = useMemo(() => {
    const totalEstimado = ferramentas.reduce((sum, f) => sum + (f.precoEstimado ?? 0), 0)
    const totalInvestido = ferramentas
      .filter((f) => f.status === 'comprada')
      .reduce((sum, f) => sum + (f.precoPago ?? 0), 0)
    const faltaPorFase: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 }
    for (const f of ferramentas) {
      if (f.status === 'quero_comprar') {
        faltaPorFase[f.fase] += f.precoEstimado ?? 0
      }
    }
    return { totalEstimado, totalInvestido, faltaPorFase }
  }, [ferramentas])

  const listaFiltrada = ferramentas.filter((f) => {
    if (filtroStatus !== 'todas' && f.status !== filtroStatus) return false
    if (filtroFase !== 'todas' && String(f.fase) !== filtroFase) return false
    return true
  })

  if (ferramentasQuery.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ferramentas</h1>
        <Button size="icon" aria-label="Nova ferramenta" onClick={() => setNovaAberta(true)}>
          <Plus className="size-5" />
        </Button>
      </div>

      {ferramentas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Nenhuma ferramenta cadastrada ainda.
            </p>
            <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              {seedMutation.isPending ? 'Carregando...' : 'Carregar lista inicial sugerida'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total estimado da lista</span>
                <span className="font-medium">{formatBRL(totais.totalEstimado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já investido</span>
                <span className="font-medium text-primary">
                  {formatBRL(totais.totalInvestido)}
                </span>
              </div>
              <div className="mt-1 border-t border-border pt-2">
                {([1, 2, 3] as const).map((fase) => (
                  <div key={fase} className="flex justify-between">
                    <span className="text-muted-foreground">Falta pra Fase {fase}</span>
                    <span>{formatBRL(totais.faltaPorFase[fase])}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                <SelectItem value="quero_comprar">Quero comprar</SelectItem>
                <SelectItem value="comprada">Comprada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroFase} onValueChange={(v) => setFiltroFase(v as FiltroFase)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as fases</SelectItem>
                <SelectItem value="1">Fase 1</SelectItem>
                <SelectItem value="2">Fase 2</SelectItem>
                <SelectItem value="3">Fase 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            {listaFiltrada.map((ferramenta) => (
              <FerramentaItem key={ferramenta.id} ferramenta={ferramenta} />
            ))}
            {listaFiltrada.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ferramenta com esse filtro.
              </p>
            ) : null}
          </div>
        </>
      )}

      <FerramentaFormDialog open={novaAberta} onOpenChange={setNovaAberta} />
    </main>
  )
}
