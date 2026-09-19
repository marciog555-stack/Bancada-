import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ClienteFormDialog } from '#/components/clientes/cliente-form-dialog'
import { formatBRL } from '#/lib/format'
import { labelStatusProjeto } from '#/lib/projeto-tipos'
import { linkWhatsApp } from '#/lib/whatsapp'
import { excluirCliente, listarProjetosDoCliente, obterCliente } from '#/lib/server/clientes'

export const Route = createFileRoute('/_authed/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editarAberto, setEditarAberto] = useState(false)

  const clienteQuery = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => obterCliente({ data: { id: clienteId } }),
  })

  const projetosQuery = useQuery({
    queryKey: ['projetos-do-cliente', clienteId],
    queryFn: () => listarProjetosDoCliente({ data: { clienteId } }),
  })

  const excluirMutation = useMutation({
    mutationFn: () => excluirCliente({ data: { id: clienteId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído.')
      await router.navigate({ to: '/clientes' })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (clienteQuery.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  const cliente = clienteQuery.data
  if (!cliente) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>
        <Link to="/clientes" className="text-sm text-primary">
          Voltar
        </Link>
      </main>
    )
  }

  const projetos = projetosQuery.data ?? []
  const totalPago = projetos.reduce((sum, p) => sum + p.totalPago, 0)

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <Link to="/clientes" aria-label="Voltar" className="text-muted-foreground">
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
              if (window.confirm('Excluir este cliente?')) excluirMutation.mutate()
            }}
            disabled={excluirMutation.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold">{cliente.nome}</h1>
        {cliente.bairro ? (
          <p className="text-sm text-muted-foreground">{cliente.bairro}</p>
        ) : null}
        {cliente.observacao ? <p className="mt-2 text-sm">{cliente.observacao}</p> : null}
      </div>

      {cliente.whatsapp ? (
        <a
          href={linkWhatsApp(cliente.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-medium text-success-foreground"
        >
          <MessageCircle className="size-4" />
          Chamar no WhatsApp
        </a>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Histórico de projetos</p>
          {projetos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
          ) : (
            <>
              {projetos.map((p) => (
                <Link
                  key={p.id}
                  to="/projetos/$projetoId"
                  params={{ projetoId: p.id }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    {p.titulo}
                    <Badge variant="secondary">{labelStatusProjeto(p.status)}</Badge>
                  </span>
                  <span>{formatBRL(p.totalPago)}</span>
                </Link>
              ))}
              <p className="mt-1 border-t border-border pt-2 text-sm text-muted-foreground">
                Total pago: <span className="text-foreground">{formatBRL(totalPago)}</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <ClienteFormDialog open={editarAberto} onOpenChange={setEditarAberto} cliente={cliente} />
    </main>
  )
}
