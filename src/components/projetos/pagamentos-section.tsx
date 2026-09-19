import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PagamentoFormDialog } from '#/components/projetos/pagamento-form-dialog'
import { formatBRL } from '#/lib/format'
import { excluirPagamento, listarPagamentos } from '#/lib/server/pagamentos'

const LABEL_FORMA = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' }

export function PagamentosSection({ projetoId }: { projetoId: string }) {
  const [novoAberto, setNovoAberto] = useState(false)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['pagamentos', projetoId],
    queryFn: () => listarPagamentos({ data: { projetoId } }),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirPagamento({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pagamentos', projetoId] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const pagamentos = query.data ?? []
  const totalRecebido = pagamentos.reduce((sum, p) => sum + p.valor, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pagamentos</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setNovoAberto(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {pagamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento recebido ainda.</p>
        ) : (
          <>
            {pagamentos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {p.data.split('-').reverse().join('/')} · {LABEL_FORMA[p.forma]}
                </span>
                <span className="flex items-center gap-1">
                  {formatBRL(p.valor)}
                  <button
                    type="button"
                    aria-label="Excluir pagamento"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => excluirMutation.mutate(p.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>
            ))}
            <p className="mt-1 border-t border-border pt-2 text-sm text-muted-foreground">
              Total recebido:{' '}
              <span className="text-foreground">{formatBRL(totalRecebido)}</span>
            </p>
          </>
        )}
      </CardContent>

      <PagamentoFormDialog open={novoAberto} onOpenChange={setNovoAberto} projetoId={projetoId} />
    </Card>
  )
}
