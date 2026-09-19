import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { STATUS_PROJETO, TIPOS_PROJETO   } from '#/lib/projeto-tipos'
import type {StatusProjeto, TipoProjeto} from '#/lib/projeto-tipos';
import { atualizarProjeto, criarProjeto } from '#/lib/server/projetos'
import type { Projeto } from '#/lib/server/projetos'
import { listarClientes } from '#/lib/server/clientes'

const SEM_CLIENTE = 'sem-cliente'

export function ProjetoFormDialog({
  open,
  onOpenChange,
  projeto,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projeto?: Projeto
  onCreated?: (id: string) => void
}) {
  const editando = !!projeto
  const [titulo, setTitulo] = useState(projeto?.titulo ?? '')
  const [descricao, setDescricao] = useState(projeto?.descricao ?? '')
  const [tipo, setTipo] = useState<TipoProjeto>(
    projeto ? (projeto.tipo as TipoProjeto) : 'reparo',
  )
  const [status, setStatus] = useState<StatusProjeto>(
    projeto ? (projeto.status as StatusProjeto) : 'orcamento',
  )
  const [valorCobrado, setValorCobrado] = useState(
    projeto?.valorCobrado != null ? String(projeto.valorCobrado) : '',
  )
  const [dataPrevista, setDataPrevista] = useState(projeto?.dataPrevista ?? '')
  const [clienteId, setClienteId] = useState(projeto?.clienteId ?? SEM_CLIENTE)
  const queryClient = useQueryClient()

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => listarClientes(),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        titulo,
        descricao: descricao.trim() || null,
        tipo,
        status,
        valorCobrado: valorCobrado ? Number(valorCobrado) : null,
        dataPrevista: dataPrevista || null,
        clienteId: clienteId === SEM_CLIENTE ? null : clienteId,
      }
      return editando
        ? atualizarProjeto({ data: { ...payload, id: projeto.id } })
        : criarProjeto({ data: payload })
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['projetos'] })
      if (projeto) {
        await queryClient.invalidateQueries({ queryKey: ['projeto', projeto.id] })
      }
      toast.success(editando ? 'Projeto atualizado.' : 'Projeto criado.')
      onOpenChange(false)
      if (!editando) onCreated?.(result.id)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar projeto' : 'Novo projeto'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (titulo.trim()) mutation.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo-projeto">Título</Label>
            <Input
              id="titulo-projeto"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_CLIENTE}>Sem cliente</SelectItem>
                {(clientesQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao-projeto">Descrição</Label>
            <Textarea
              id="descricao-projeto"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusProjeto)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PROJETO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor-cobrado">Valor cobrado</Label>
              <Input
                id="valor-cobrado"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data-prevista">Data prevista</Label>
              <Input
                id="data-prevista"
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !titulo.trim()}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
