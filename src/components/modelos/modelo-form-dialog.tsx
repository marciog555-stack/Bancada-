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
import { MATERIAIS_SISTEMA, TIPOS_PROJETO } from '#/lib/projeto-tipos'
import type { MaterialSistema, TipoProjeto } from '#/lib/projeto-tipos'
import { atualizarModelo, criarModelo } from '#/lib/server/modelos'
import type { ModeloServico } from '#/lib/server/modelos'

const SEM_MATERIAL = 'sem-material'

export function ModeloFormDialog({
  open,
  onOpenChange,
  modelo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelo?: ModeloServico
}) {
  const editando = !!modelo
  const [tipo, setTipo] = useState<TipoProjeto>(
    modelo ? (modelo.tipo as TipoProjeto) : 'forro',
  )
  const [materialSistema, setMaterialSistema] = useState(modelo?.materialSistema ?? SEM_MATERIAL)
  const [titulo, setTitulo] = useState(modelo?.titulo ?? '')
  const [instrucoes, setInstrucoes] = useState(modelo?.instrucoes ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        tipo,
        materialSistema: materialSistema === SEM_MATERIAL ? null : (materialSistema as MaterialSistema),
        titulo,
        instrucoes,
      }
      return editando
        ? atualizarModelo({ data: { ...payload, id: modelo.id } })
        : criarModelo({ data: payload })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['modelos'] })
      toast.success(editando ? 'Modelo atualizado.' : 'Modelo criado.')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (titulo.trim() && instrucoes.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo-modelo">Título</Label>
            <Input
              id="titulo-modelo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex flex-col gap-2">
              <Label>Material</Label>
              <Select value={materialSistema} onValueChange={setMaterialSistema}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_MATERIAL}>—</SelectItem>
                  {MATERIAIS_SISTEMA.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instrucoes-modelo">Instruções</Label>
            <Textarea
              id="instrucoes-modelo"
              required
              rows={8}
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              placeholder="Passo a passo, materiais e fixações padrão, cuidados..."
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending || !titulo.trim() || !instrucoes.trim()}
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
