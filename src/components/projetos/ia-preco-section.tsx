import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { formatBRL } from '#/lib/format'
import { sugerirPreco  } from '#/lib/server/ia'
import type {SugestaoPreco} from '#/lib/server/ia';
import { atualizarProjeto  } from '#/lib/server/projetos'
import type {Projeto} from '#/lib/server/projetos';

export function IaPrecoSection({ projeto }: { projeto: Projeto }) {
  const [sugestao, setSugestao] = useState<SugestaoPreco | null>(null)
  const queryClient = useQueryClient()

  const sugerirMutation = useMutation({
    mutationFn: () => sugerirPreco({ data: { projetoId: projeto.id } }),
    onSuccess: (resultado) => setSugestao(resultado),
    onError: (error: Error) => toast.error(error.message),
  })

  const usarValorMutation = useMutation({
    mutationFn: (valor: number) =>
      atualizarProjeto({
        data: {
          id: projeto.id,
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          tipo: projeto.tipo,
          status: projeto.status,
          dataPrevista: projeto.dataPrevista,
          clienteId: projeto.clienteId,
          valorCobrado: valor,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projeto', projeto.id] })
      await queryClient.invalidateQueries({ queryKey: ['projetos'] })
      toast.success('Valor cobrado atualizado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sugerir preço com IA</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sugerirMutation.mutate()}
            disabled={sugerirMutation.isPending}
          >
            <CircleDollarSign className="size-4" />
            {sugerirMutation.isPending ? 'Pensando...' : 'Sugerir'}
          </Button>
        </div>
      </CardHeader>
      {sugestao ? (
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="text-lg font-semibold">
            {formatBRL(sugestao.faixaMin)} – {formatBRL(sugestao.faixaMax)}
          </p>
          <p className="text-muted-foreground">{sugestao.justificativa}</p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() =>
              usarValorMutation.mutate((sugestao.faixaMin + sugestao.faixaMax) / 2)
            }
            disabled={usarValorMutation.isPending}
          >
            Usar valor médio como valor cobrado
          </Button>
        </CardContent>
      ) : null}
    </Card>
  )
}
