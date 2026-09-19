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
import { marcarComprada  } from '#/lib/server/ferramentas'
import type {Ferramenta} from '#/lib/server/ferramentas';
import { hojeISO } from '#/lib/agenda'

export function MarcarCompradaDialog({
  open,
  onOpenChange,
  ferramenta,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ferramenta: Ferramenta
}) {
  const [precoPago, setPrecoPago] = useState(
    ferramenta.precoEstimado != null ? String(ferramenta.precoEstimado) : '',
  )
  const [dataCompra, setDataCompra] = useState(hojeISO())
  const [ondeComprei, setOndeComprei] = useState(ferramenta.ondeComprei ?? '')
  const [condicao, setCondicao] = useState<'nova' | 'usada'>(
    ferramenta.condicao ?? 'nova',
  )
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      marcarComprada({
        data: {
          id: ferramenta.id,
          precoPago: Number(precoPago),
          dataCompra,
          ondeComprei: ondeComprei.trim() || null,
          condicao,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success('Ferramenta marcada como comprada.')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como comprada — {ferramenta.nome}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (precoPago) mutation.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preco-pago">Preço pago</Label>
              <Input
                id="preco-pago"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                value={precoPago}
                onChange={(e) => setPrecoPago(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data-compra">Data</Label>
              <Input
                id="data-compra"
                type="date"
                required
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="onde-comprei-compra">Onde comprou</Label>
              <Input
                id="onde-comprei-compra"
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
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="usada">Usada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !precoPago}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
