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
import { Textarea } from '#/components/ui/textarea'
import { atualizarCliente, criarCliente  } from '#/lib/server/clientes'
import type {Cliente} from '#/lib/server/clientes';

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente
  onCreated?: (id: string) => void
}) {
  const editando = !!cliente
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ?? '')
  const [bairro, setBairro] = useState(cliente?.bairro ?? '')
  const [observacao, setObservacao] = useState(cliente?.observacao ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        nome,
        whatsapp: whatsapp.trim() || null,
        bairro: bairro.trim() || null,
        observacao: observacao.trim() || null,
      }
      return editando
        ? atualizarCliente({ data: { ...payload, id: cliente.id } })
        : criarCliente({ data: payload })
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      if (cliente) {
        await queryClient.invalidateQueries({ queryKey: ['cliente', cliente.id] })
      }
      toast.success(editando ? 'Cliente atualizado.' : 'Cliente adicionado.')
      onOpenChange(false)
      if (!editando) onCreated?.(result.id)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-cliente">Nome</Label>
            <Input
              id="nome-cliente"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsapp-cliente">WhatsApp</Label>
              <Input
                id="whatsapp-cliente"
                type="tel"
                inputMode="tel"
                placeholder="62999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bairro-cliente">Bairro</Label>
              <Input
                id="bairro-cliente"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="observacao-cliente">Observação</Label>
            <Textarea
              id="observacao-cliente"
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
