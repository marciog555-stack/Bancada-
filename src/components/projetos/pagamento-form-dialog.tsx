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
import { hojeISO } from '#/lib/agenda'
import { criarPagamento } from '#/lib/server/pagamentos'

export function PagamentoFormDialog({
  open,
  onOpenChange,
  projetoId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projetoId: string
}) {
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hojeISO())
  const [forma, setForma] = useState<'pix' | 'dinheiro' | 'cartao'>('pix')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      criarPagamento({ data: { projetoId, valor: Number(valor), data, forma } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pagamentos', projetoId] })
      toast.success('Pagamento lançado.')
      setValor('')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo pagamento</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valor) mutation.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor-pagamento">Valor</Label>
              <Input
                id="valor-pagamento"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data-pagamento">Data</Label>
              <Input
                id="data-pagamento"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Forma</Label>
            <Select value={forma} onValueChange={(v) => setForma(v as typeof forma)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !valor}>
              {mutation.isPending ? 'Salvando...' : 'Lançar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
