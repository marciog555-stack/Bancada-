import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { VincularFerramentaDialog } from '#/components/projetos/vincular-ferramenta-dialog'
import { formatBRL } from '#/lib/format'
import {
  desvincularFerramenta,
  listarFerramentasDoProjeto,
} from '#/lib/server/projeto-ferramentas'

export function FerramentasSection({ projetoId }: { projetoId: string }) {
  const [vincularAberto, setVincularAberto] = useState(false)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['projeto-ferramentas', projetoId],
    queryFn: () => listarFerramentasDoProjeto({ data: { projetoId } }),
  })

  const desvincularMutation = useMutation({
    mutationFn: (vinculoId: string) => desvincularFerramenta({ data: { vinculoId } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['projeto-ferramentas', projetoId] }),
    onError: (error: Error) => toast.error(error.message),
  })

  const ferramentas = query.data ?? []
  const faltaInvestir = ferramentas
    .filter((f) => !f.tenho)
    .reduce((sum, f) => sum + (f.precoEstimado ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ferramentas</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setVincularAberto(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ferramentas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ferramenta vinculada.</p>
        ) : (
          <>
            {ferramentas.map((f) => (
              <div
                key={f.vinculoId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {f.tenho ? '✅' : '⚠️'} {f.nome}
                  {f.essencial ? '' : ' (opcional)'}
                </span>
                <button
                  type="button"
                  aria-label="Desvincular"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => desvincularMutation.mutate(f.vinculoId)}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {faltaInvestir > 0 ? (
              <p className="mt-1 border-t border-border pt-2 text-sm text-muted-foreground">
                Falta investir: <span className="text-foreground">{formatBRL(faltaInvestir)}</span>
              </p>
            ) : null}
          </>
        )}
      </CardContent>

      <VincularFerramentaDialog
        open={vincularAberto}
        onOpenChange={setVincularAberto}
        projetoId={projetoId}
        idsJaVinculados={ferramentas.map((f) => f.ferramentaId)}
      />
    </Card>
  )
}
