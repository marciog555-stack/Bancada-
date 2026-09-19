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
import { atualizarMaterial, criarMaterial  } from '#/lib/server/materiais'
import type {Material} from '#/lib/server/materiais';

export function MaterialFormDialog({
  open,
  onOpenChange,
  projetoId,
  material,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projetoId: string
  material?: Material
}) {
  const editando = !!material
  const [nome, setNome] = useState(material?.nome ?? '')
  const [quantidade, setQuantidade] = useState(
    material?.quantidade != null ? String(material.quantidade) : '',
  )
  const [unidade, setUnidade] = useState(material?.unidade ?? '')
  const [custo, setCusto] = useState(material?.custo != null ? String(material.custo) : '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        nome,
        quantidade: quantidade ? Number(quantidade) : null,
        unidade: unidade.trim() || null,
        custo: custo ? Number(custo) : null,
      }
      return editando
        ? atualizarMaterial({ data: { ...payload, id: material.id } })
        : criarMaterial({ data: { ...payload, projetoId } })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materiais', projetoId] })
      toast.success(editando ? 'Material atualizado.' : 'Material adicionado.')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar material' : 'Novo material'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-material">Nome</Label>
            <Input
              id="nome-material"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantidade-material">Quantidade</Label>
              <Input
                id="quantidade-material"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unidade-material">Unidade</Label>
              <Input
                id="unidade-material"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="m², un, barra..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="custo-material">Custo</Label>
            <Input
              id="custo-material"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
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
