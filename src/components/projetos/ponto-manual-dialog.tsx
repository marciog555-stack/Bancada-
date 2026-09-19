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
import { hojeISO } from '#/lib/agenda'
import { registrarPontoManual } from '#/lib/server/ponto'

// América/São_Paulo não observa horário de verão desde 2019: offset fixo -03:00.
const OFFSET_SAO_PAULO = '-03:00'

export function PontoManualDialog({
  open,
  onOpenChange,
  projetoId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projetoId: string
}) {
  const [data, setData] = useState(hojeISO())
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      registrarPontoManual({
        data: {
          projetoId,
          inicio: `${data}T${horaInicio}:00${OFFSET_SAO_PAULO}`,
          fim: `${data}T${horaFim}:00${OFFSET_SAO_PAULO}`,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['registros-ponto', projetoId] })
      toast.success('Horas lançadas.')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar horas manualmente</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (horaInicio && horaFim) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="data-ponto-manual">Data</Label>
            <Input
              id="data-ponto-manual"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora-inicio-ponto">Início</Label>
              <Input
                id="hora-inicio-ponto"
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora-fim-ponto">Fim</Label>
              <Input
                id="hora-fim-ponto"
                type="time"
                required
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !horaInicio || !horaFim}>
              {mutation.isPending ? 'Salvando...' : 'Lançar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
