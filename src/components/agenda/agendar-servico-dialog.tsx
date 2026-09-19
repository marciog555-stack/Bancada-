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
import { criarServicoAgendado } from '#/lib/server/servicos-agendados'
import { TIPOS_PROJETO  } from '#/lib/projeto-tipos'
import type {TipoProjeto} from '#/lib/projeto-tipos';
import { labelDataCurta, labelDiaSemana } from '#/lib/agenda'

export function AgendarServicoDialog({
  open,
  onOpenChange,
  dataISO,
  janelaInicio,
  janelaFim,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataISO: string
  janelaInicio: string | null
  janelaFim: string | null
}) {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoProjeto>('reparo')
  const [horaInicio, setHoraInicio] = useState(janelaInicio ?? '')
  const [horaFim, setHoraFim] = useState(janelaFim ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      criarServicoAgendado({
        data: {
          titulo,
          tipo,
          dataAgendada: dataISO,
          horaInicioAgendada: horaInicio || null,
          horaFimAgendada: horaFim || null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['servicos-agendados'] })
      toast.success('Serviço agendado.')
      setTitulo('')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Agendar serviço — {labelDiaSemana(dataISO)} {labelDataCurta(dataISO)}
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (titulo.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo-servico">Título</Label>
            <Input
              id="titulo-servico"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Troca de tomadas — Sr. João"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoProjeto)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PROJETO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora-inicio">Início</Label>
              <Input
                id="hora-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora-fim">Fim</Label>
              <Input
                id="hora-fim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !titulo.trim()}>
              {mutation.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
