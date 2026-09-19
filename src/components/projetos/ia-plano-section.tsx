import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { criarFerramenta } from '#/lib/server/ferramentas'
import { planejarProjeto, salvarNotasIa  } from '#/lib/server/ia'
import type {PlanoProjeto} from '#/lib/server/ia';
import { criarMaterial } from '#/lib/server/materiais'
import { vincularFerramenta } from '#/lib/server/projeto-ferramentas'

export function IaPlanoSection({ projetoId }: { projetoId: string }) {
  const [plano, setPlano] = useState<PlanoProjeto | null>(null)
  const queryClient = useQueryClient()

  const planejarMutation = useMutation({
    mutationFn: () => planejarProjeto({ data: { projetoId } }),
    onSuccess: (resultado) => setPlano(resultado),
    onError: (error: Error) => toast.error(error.message),
  })

  const adicionarFerramentaMutation = useMutation({
    mutationFn: (nome: string) =>
      criarFerramenta({
        data: {
          nome,
          categoria: null,
          fase: 1,
          precoEstimado: null,
          ondeComprei: null,
          condicao: null,
          observacao: null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success('Ferramenta adicionada à lista de compras.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const vincularMutation = useMutation({
    mutationFn: (input: { ferramentaId: string; essencial: boolean }) =>
      vincularFerramenta({ data: { projetoId, ...input } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projeto-ferramentas', projetoId] })
      toast.success('Ferramenta vinculada ao projeto.')
    },
    onError: () => toast.error('Já vinculada ou não foi possível vincular.'),
  })

  const adicionarMaterialMutation = useMutation({
    mutationFn: (material: { nome: string; quantidade: number; unidade: string }) =>
      criarMaterial({
        data: {
          projetoId,
          nome: material.nome,
          quantidade: material.quantidade,
          unidade: material.unidade,
          custo: null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materiais', projetoId] })
      toast.success('Material adicionado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const salvarNotasMutation = useMutation({
    mutationFn: () => {
      if (!plano) throw new Error('Nada pra salvar.')
      return salvarNotasIa({
        data: {
          projetoId,
          etapas: plano.etapas,
          horasEstimadas: plano.horasEstimadas,
          alertasSeguranca: plano.alertasSeguranca,
          observacoes: plano.observacoes,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projeto', projetoId] })
      toast.success('Notas do plano salvas.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Planejar com IA</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => planejarMutation.mutate()}
            disabled={planejarMutation.isPending}
          >
            <Sparkles className="size-4" />
            {planejarMutation.isPending ? 'Pensando...' : plano ? 'Gerar de novo' : 'Planejar'}
          </Button>
        </div>
      </CardHeader>
      {plano ? (
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Nada foi salvo ainda — revise e aceite item por item.
          </p>

          <div className="flex flex-col gap-2">
            <p className="font-medium">Ferramentas</p>
            {plano.ferramentas.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span>
                  {f.cadastrada ? (f.jaTenho ? '✅' : '⚠️') : '❔'} {f.nome}
                  {f.essencial ? '' : ' (opcional)'}
                </span>
                {f.cadastrada && f.ferramentaId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      vincularMutation.mutate({
                        ferramentaId: f.ferramentaId as string,
                        essencial: f.essencial,
                      })
                    }
                  >
                    Vincular
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adicionarFerramentaMutation.mutate(f.nome)}
                  >
                    Add à lista
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-medium">Materiais</p>
            {plano.materiais.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span>
                  {m.nome} — {m.quantidade} {m.unidade}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adicionarMaterialMutation.mutate(m)}
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>

          <div>
            <p className="font-medium">Etapas</p>
            <ol className="list-decimal pl-4 text-muted-foreground">
              {plano.etapas.map((etapa, i) => (
                <li key={i}>{etapa}</li>
              ))}
            </ol>
          </div>

          <p>
            <span className="font-medium">Horas estimadas:</span> {plano.horasEstimadas}h
          </p>

          {plano.alertasSeguranca.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <p className="flex items-center gap-1 font-medium text-destructive">
                <TriangleAlert className="size-4" />
                Segurança
              </p>
              <ul className="list-disc pl-4 text-muted-foreground">
                {plano.alertasSeguranca.map((alerta, i) => (
                  <li key={i}>{alerta}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {plano.observacoes ? (
            <p className="text-muted-foreground">{plano.observacoes}</p>
          ) : null}

          <Button
            variant="secondary"
            onClick={() => salvarNotasMutation.mutate()}
            disabled={salvarNotasMutation.isPending}
          >
            Salvar notas do plano
          </Button>
        </CardContent>
      ) : (
        <CardContent>
          <Badge variant="secondary">Ainda não gerado</Badge>
        </CardContent>
      )}
    </Card>
  )
}
