import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { DiaCard } from '#/components/agenda/dia-card'
import { EscalaForm } from '#/components/agenda/escala-form'
import { EditarEscalaDialog } from '#/components/agenda/editar-escala-dialog'
import { PontoWidget } from '#/components/agenda/ponto-widget'
import { getSemana, hojeISO } from '#/lib/agenda'
import { signOut } from '#/lib/auth'
import { getConfiguracaoEscala } from '#/lib/server/escala'
import { definirTreino, listarTreinos } from '#/lib/server/treino'
import {
  listarServicosAgendados
  
} from '#/lib/server/servicos-agendados'
import type {ServicoAgendado} from '#/lib/server/servicos-agendados';
import { getPontoAtivo } from '#/lib/server/ponto'

export const Route = createFileRoute('/_authed/')({
  component: HojePage,
})

function HojePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const hoje = hojeISO()
  const semana = getSemana(hoje)

  const configQuery = useQuery({
    queryKey: ['configuracao-escala'],
    queryFn: () => getConfiguracaoEscala(),
  })
  const referencia = configQuery.data?.dataPlantaoReferencia

  const servicosQuery = useQuery({
    queryKey: ['servicos-agendados', semana[0], semana[6]],
    queryFn: () =>
      listarServicosAgendados({ data: { deISO: semana[0], ateISO: semana[6] } }),
    enabled: !!referencia,
  })

  const treinosQuery = useQuery({
    queryKey: ['treinos', semana[0], semana[6]],
    queryFn: () => listarTreinos({ data: { datasISO: semana } }),
    enabled: !!referencia,
  })

  const pontoQuery = useQuery({
    queryKey: ['ponto-ativo'],
    queryFn: () => getPontoAtivo(),
    enabled: !!referencia,
  })

  const treinoMutation = useMutation({
    mutationFn: (input: { dataISO: string; treinou: boolean }) => definirTreino({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['treinos'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  async function handleSignOut() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  if (configQuery.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  if (!referencia) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-8">
        <h1 className="text-2xl font-bold">Bem-vindo à Bancada</h1>
        <Card>
          <CardContent>
            <EscalaForm />
          </CardContent>
        </Card>
      </main>
    )
  }

  const servicosPorDia = new Map<string, Array<ServicoAgendado>>()
  for (const servico of servicosQuery.data ?? []) {
    const lista = servicosPorDia.get(servico.dataAgendada) ?? []
    lista.push(servico)
    servicosPorDia.set(servico.dataAgendada, lista)
  }

  const servicoHoje = servicosPorDia.get(hoje)?.[0]

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hoje</h1>
        <div className="flex items-center gap-1">
          <EditarEscalaDialog dataAtual={referencia} />
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleSignOut}>
            <LogOut className="size-5" />
          </Button>
        </div>
      </div>

      <PontoWidget servicoHoje={servicoHoje} pontoAtivo={pontoQuery.data} />

      <div className="flex flex-col gap-3">
        {semana.map((dataISO) => (
          <DiaCard
            key={dataISO}
            dataISO={dataISO}
            referenciaISO={referencia}
            destaque={dataISO === hoje}
            servicos={servicosPorDia.get(dataISO) ?? []}
            treinou={treinosQuery.data?.[dataISO]}
            onToggleTreino={(treinou) => treinoMutation.mutate({ dataISO, treinou })}
          />
        ))}
      </div>
    </main>
  )
}
