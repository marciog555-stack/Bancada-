import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ProjetoFormDialog } from '#/components/projetos/projeto-form-dialog'
import { labelStatusProjeto, labelTipoProjeto } from '#/lib/projeto-tipos'
import { formatBRL } from '#/lib/format'
import { listarProjetos, seedProjetoForroWPC } from '#/lib/server/projetos'

export const Route = createFileRoute('/_authed/projetos/')({
  component: ProjetosPage,
})

function ProjetosPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [novoAberto, setNovoAberto] = useState(false)

  const projetosQuery = useQuery({
    queryKey: ['projetos'],
    queryFn: () => listarProjetos(),
  })

  const seedMutation = useMutation({
    mutationFn: () => seedProjetoForroWPC(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['projetos'] })
      toast.success('Projeto de exemplo criado.')
      await router.navigate({ to: '/projetos/$projetoId', params: { projetoId: result.id } })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const projetos = projetosQuery.data ?? []

  if (projetosQuery.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <div className="flex items-center gap-1">
          <Link to="/modelos" aria-label="Modelos">
            <Button variant="ghost" size="icon">
              <FileText className="size-5" />
            </Button>
          </Link>
          <Link to="/clientes" aria-label="Clientes">
            <Button variant="ghost" size="icon">
              <Users className="size-5" />
            </Button>
          </Link>
          <Button size="icon" aria-label="Novo projeto" onClick={() => setNovoAberto(true)}>
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {projetos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
            <Button onClick={() => setNovoAberto(true)}>Novo projeto</Button>
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? 'Carregando...' : 'Carregar exemplo (Forro WPC)'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {projetos.map((projeto) => (
            <Link
              key={projeto.id}
              to="/projetos/$projetoId"
              params={{ projetoId: projeto.id }}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{projeto.titulo}</p>
                <Badge variant="secondary">{labelStatusProjeto(projeto.status)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {labelTipoProjeto(projeto.tipo)}
                {projeto.valorCobrado != null ? ` · ${formatBRL(projeto.valorCobrado)}` : ''}
                {projeto.dataPrevista
                  ? ` · ${projeto.dataPrevista.split('-').reverse().join('/')}`
                  : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      <ProjetoFormDialog
        open={novoAberto}
        onOpenChange={setNovoAberto}
        onCreated={(id) => router.navigate({ to: '/projetos/$projetoId', params: { projetoId: id } })}
      />
    </main>
  )
}
