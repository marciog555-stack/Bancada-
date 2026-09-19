import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, ShoppingCart, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { desfazerCompra, excluirFerramenta  } from '#/lib/server/ferramentas'
import type {Ferramenta} from '#/lib/server/ferramentas';
import { formatBRL } from '#/lib/format'
import { FerramentaFormDialog } from '#/components/ferramentas/ferramenta-form-dialog'
import { MarcarCompradaDialog } from '#/components/ferramentas/marcar-comprada-dialog'

export function FerramentaItem({ ferramenta }: { ferramenta: Ferramenta }) {
  const [editarAberto, setEditarAberto] = useState(false)
  const [comprarAberto, setComprarAberto] = useState(false)
  const queryClient = useQueryClient()
  const comprada = ferramenta.status === 'comprada'

  const desfazerMutation = useMutation({
    mutationFn: () => desfazerCompra({ data: { id: ferramenta.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ferramentas'] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const excluirMutation = useMutation({
    mutationFn: () => excluirFerramenta({ data: { id: ferramenta.id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success('Ferramenta removida.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{ferramenta.nome}</p>
          {ferramenta.categoria ? (
            <p className="text-xs text-muted-foreground">{ferramenta.categoria}</p>
          ) : null}
        </div>
        <Badge variant={comprada ? 'default' : 'secondary'}>
          {comprada ? 'Comprada' : 'Quero comprar'}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {comprada ? (
          <p>
            Pago {formatBRL(ferramenta.precoPago)}
            {ferramenta.dataCompra ? ` em ${ferramenta.dataCompra.split('-').reverse().join('/')}` : ''}
            {ferramenta.ondeComprei ? ` · ${ferramenta.ondeComprei}` : ''}
          </p>
        ) : (
          <p>Estimado {formatBRL(ferramenta.precoEstimado)}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {comprada ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => desfazerMutation.mutate()}
            disabled={desfazerMutation.isPending}
          >
            <Undo2 className="size-4" />
            Desfazer
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setComprarAberto(true)}>
            <ShoppingCart className="size-4" />
            Marcar como comprada
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditarAberto(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir"
          onClick={() => excluirMutation.mutate()}
          disabled={excluirMutation.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <FerramentaFormDialog
        open={editarAberto}
        onOpenChange={setEditarAberto}
        ferramenta={ferramenta}
      />
      <MarcarCompradaDialog
        open={comprarAberto}
        onOpenChange={setComprarAberto}
        ferramenta={ferramenta}
      />
    </div>
  )
}
