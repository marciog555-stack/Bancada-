import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { formatBRL } from '#/lib/format'
import { listarMateriais } from '#/lib/server/materiais'
import { listarPagamentos } from '#/lib/server/pagamentos'
import { listarRegistrosPonto } from '#/lib/server/ponto'

export function ResumoCard({ projetoId }: { projetoId: string }) {
  const pagamentosQuery = useQuery({
    queryKey: ['pagamentos', projetoId],
    queryFn: () => listarPagamentos({ data: { projetoId } }),
  })
  const materiaisQuery = useQuery({
    queryKey: ['materiais', projetoId],
    queryFn: () => listarMateriais({ data: { projetoId } }),
  })
  const registrosQuery = useQuery({
    queryKey: ['registros-ponto', projetoId],
    queryFn: () => listarRegistrosPonto({ data: { projetoId } }),
  })

  const recebido = (pagamentosQuery.data ?? []).reduce((sum, p) => sum + p.valor, 0)
  const custoMateriais = (materiaisQuery.data ?? []).reduce((sum, m) => sum + (m.custo ?? 0), 0)
  const horas = (registrosQuery.data ?? []).reduce((sum, r) => {
    if (!r.fim) return sum
    return sum + (new Date(r.fim).getTime() - new Date(r.inicio).getTime()) / 3_600_000
  }, 0)
  const lucro = recebido - custoMateriais
  const valorHora = horas > 0 ? lucro / horas : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recebido</span>
          <span>{formatBRL(recebido)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Materiais</span>
          <span>− {formatBRL(custoMateriais)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span>Lucro</span>
          <span className={lucro >= 0 ? 'text-primary' : 'text-destructive'}>
            {formatBRL(lucro)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Valor da sua hora</span>
          <span>{valorHora != null ? `${formatBRL(valorHora)}/h` : '—'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
