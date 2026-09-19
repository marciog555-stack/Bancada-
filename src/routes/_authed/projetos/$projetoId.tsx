import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { FerramentasSection } from '#/components/projetos/ferramentas-section'
import { MateriaisSection } from '#/components/projetos/materiais-section'
import { PagamentosSection } from '#/components/projetos/pagamentos-section'
import { PontoSection } from '#/components/projetos/ponto-section'
import { ProjetoFormDialog } from '#/components/projetos/projeto-form-dialog'
import { ResumoCard } from '#/components/projetos/resumo-card'
import { formatBRL } from '#/lib/format'
import { labelStatusProjeto, labelTipoProjeto } from '#/lib/projeto-tipos'
import { excluirProjeto, obterProjeto } from '#/lib/server/projetos'

export const Route = createFileRoute('/_authed/projetos/$projetoId')({
  component: ProjetoDetailPage,
})

function ProjetoDetailPage() {
  const { projetoId } = Route.useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editarAberto, setEditarAberto] = useState(false)

  const query = useQuery({
    queryKey: ['projeto', projetoId],
    queryFn: () => obterProjeto({ data: { id: projetoId } }),
  })

  const excluirMutation = useMutation({
    mutationFn: () => excluirProjeto({ data: { id: projetoId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projetos'] })
      toast.success('Projeto excluído.')
      await router.navigate({ to: '/projetos' })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (query.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  const projeto = query.data
  if (!projeto) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
        <Link to="/projetos" className="text-sm text-primary">
          Voltar
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <Link to="/projetos" aria-label="Voltar" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditarAberto(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.confirm('Excluir este projeto e todos os dados ligados a ele?')) {
                excluirMutation.mutate()
              }
            }}
            disabled={excluirMutation.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{projeto.titulo}</h1>
          <Badge variant="secondary">{labelStatusProjeto(projeto.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {labelTipoProjeto(projeto.tipo)}
          {projeto.valorCobrado != null ? ` · ${formatBRL(projeto.valorCobrado)}` : ''}
          {projeto.dataPrevista
            ? ` · previsto ${projeto.dataPrevista.split('-').reverse().join('/')}`
            : ''}
        </p>
        {projeto.descricao ? (
          <p className="mt-2 text-sm whitespace-pre-wrap">{projeto.descricao}</p>
        ) : null}
      </div>

      <FerramentasSection projetoId={projeto.id} />
      <MateriaisSection projetoId={projeto.id} />
      <PagamentosSection projetoId={projeto.id} />
      <PontoSection projetoId={projeto.id} />
      <ResumoCard projetoId={projeto.id} />

      <ProjetoFormDialog
        open={editarAberto}
        onOpenChange={setEditarAberto}
        projeto={projeto}
      />
    </main>
  )
}
