import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ModeloFormDialog } from '#/components/modelos/modelo-form-dialog'
import { labelMaterialSistema, labelTipoProjeto } from '#/lib/projeto-tipos'
import { excluirModelo, listarModelos } from '#/lib/server/modelos'
import type { ModeloServico } from '#/lib/server/modelos'

export const Route = createFileRoute('/_authed/modelos/')({
  component: ModelosPage,
})

function ModelosPage() {
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<ModeloServico | undefined>(undefined)
  const queryClient = useQueryClient()

  const modelosQuery = useQuery({
    queryKey: ['modelos'],
    queryFn: () => listarModelos(),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirModelo({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['modelos'] })
      toast.success('Modelo removido.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const modelos = modelosQuery.data ?? []

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/projetos" aria-label="Voltar" className="text-muted-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold">Modelos</h1>
        </div>
        <Button size="icon" aria-label="Novo modelo" onClick={() => setNovoAberto(true)}>
          <Plus className="size-5" />
        </Button>
      </div>

      {modelosQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : modelos.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum modelo cadastrado ainda. Modelos guiam a IA a seguir seu jeito de
              fazer um serviço (tipo + material).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {modelos.map((modelo) => (
            <div key={modelo.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{modelo.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {labelTipoProjeto(modelo.tipo)}
                    {modelo.materialSistema
                      ? ` · ${labelMaterialSistema(modelo.materialSistema)}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditando(modelo)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => excluirMutation.mutate(modelo.id)}
                    disabled={excluirMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                {modelo.instrucoes}
              </p>
            </div>
          ))}
        </div>
      )}

      <ModeloFormDialog open={novoAberto} onOpenChange={setNovoAberto} />
      {editando ? (
        <ModeloFormDialog
          open={!!editando}
          onOpenChange={(open) => !open && setEditando(undefined)}
          modelo={editando}
        />
      ) : null}
    </main>
  )
}
