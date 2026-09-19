import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import {
  atualizarFerramenta,
  criarFerramenta
  
} from '#/lib/server/ferramentas'
import type {Ferramenta} from '#/lib/server/ferramentas';

export function FerramentaFormDialog({
  open,
  onOpenChange,
  ferramenta,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ferramenta?: Ferramenta
}) {
  const editando = !!ferramenta
  const [nome, setNome] = useState(ferramenta?.nome ?? '')
  const [categoria, setCategoria] = useState(ferramenta?.categoria ?? '')
  const [fase, setFase] = useState<1 | 2 | 3>(ferramenta?.fase ?? 1)
  const [precoEstimado, setPrecoEstimado] = useState(
    ferramenta?.precoEstimado != null ? String(ferramenta.precoEstimado) : '',
  )
  const [ondeComprei, setOndeComprei] = useState(ferramenta?.ondeComprei ?? '')
  const [condicao, setCondicao] = useState<'nova' | 'usada' | 'nenhuma'>(
    ferramenta?.condicao ?? 'nenhuma',
  )
  const [observacao, setObservacao] = useState(ferramenta?.observacao ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        nome,
        categoria: categoria.trim() || null,
        fase,
        precoEstimado: precoEstimado ? Number(precoEstimado) : null,
        ondeComprei: ondeComprei.trim() || null,
        condicao: condicao === 'nenhuma' ? null : condicao,
        observacao: observacao.trim() || null,
      }
      return editando
        ? atualizarFerramenta({ data: { ...payload, id: ferramenta.id } })
        : criarFerramenta({ data: payload })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success(editando ? 'Ferramenta atualizada.' : 'Ferramenta adicionada.')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar ferramenta' : 'Nova ferramenta'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-ferramenta">Nome</Label>
            <Input
              id="nome-ferramenta"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Fase</Label>
              <Select value={String(fase)} onValueChange={(v) => setFase(Number(v) as 1 | 2 | 3)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Fase 1</SelectItem>
                  <SelectItem value="2">Fase 2</SelectItem>
                  <SelectItem value="3">Fase 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preco-estimado">Preço estimado</Label>
              <Input
                id="preco-estimado"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={precoEstimado}
                onChange={(e) => setPrecoEstimado(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria-ferramenta">Categoria</Label>
            <Input
              id="categoria-ferramenta"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex.: Elétrica, corte, EPI..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="onde-comprei">Onde comprar</Label>
              <Input
                id="onde-comprei"
                value={ondeComprei}
                onChange={(e) => setOndeComprei(e.target.value)}
                placeholder="Loja, OLX..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Condição</Label>
              <Select value={condicao} onValueChange={(v) => setCondicao(v as typeof condicao)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">—</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="usada">Usada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="observacao-ferramenta">Observação</Label>
            <Textarea
              id="observacao-ferramenta"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !nome.trim()}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
