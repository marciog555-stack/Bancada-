import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { MaterialFormDialog } from '#/components/projetos/material-form-dialog'
import { formatBRL } from '#/lib/format'
import { excluirMaterial, listarMateriais  } from '#/lib/server/materiais'
import type {Material} from '#/lib/server/materiais';

export function MateriaisSection({ projetoId }: { projetoId: string }) {
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<Material | undefined>(undefined)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['materiais', projetoId],
    queryFn: () => listarMateriais({ data: { projetoId } }),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirMaterial({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materiais', projetoId] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const materiais = query.data ?? []
  const totalCusto = materiais.reduce((sum, m) => sum + (m.custo ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Materiais</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setNovoAberto(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {materiais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum material lançado.</p>
        ) : (
          <>
            {materiais.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {m.nome}
                  {m.quantidade != null ? ` — ${m.quantidade} ${m.unidade ?? ''}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  {m.custo != null ? formatBRL(m.custo) : '—'}
                  <button
                    type="button"
                    aria-label="Editar material"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditando(m)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir material"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => excluirMutation.mutate(m.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>
            ))}
            <p className="mt-1 border-t border-border pt-2 text-sm text-muted-foreground">
              Total materiais: <span className="text-foreground">{formatBRL(totalCusto)}</span>
            </p>
          </>
        )}
      </CardContent>

      <MaterialFormDialog open={novoAberto} onOpenChange={setNovoAberto} projetoId={projetoId} />
      {editando ? (
        <MaterialFormDialog
          open={!!editando}
          onOpenChange={(open) => !open && setEditando(undefined)}
          projetoId={projetoId}
          material={editando}
        />
      ) : null}
    </Card>
  )
}
