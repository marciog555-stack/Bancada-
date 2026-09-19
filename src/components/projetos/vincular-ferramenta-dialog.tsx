import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { listarFerramentas } from '#/lib/server/ferramentas'
import { vincularFerramenta } from '#/lib/server/projeto-ferramentas'

export function VincularFerramentaDialog({
  open,
  onOpenChange,
  projetoId,
  idsJaVinculados,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projetoId: string
  idsJaVinculados: Array<string>
}) {
  const [ferramentaId, setFerramentaId] = useState('')
  const [essencial, setEssencial] = useState(true)
  const queryClient = useQueryClient()

  const ferramentasQuery = useQuery({
    queryKey: ['ferramentas'],
    queryFn: () => listarFerramentas(),
    enabled: open,
  })

  const disponiveis = (ferramentasQuery.data ?? []).filter(
    (f) => !idsJaVinculados.includes(f.id),
  )

  const mutation = useMutation({
    mutationFn: () =>
      vincularFerramenta({ data: { projetoId, ferramentaId, essencial } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projeto-ferramentas', projetoId] })
      toast.success('Ferramenta vinculada.')
      setFerramentaId('')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular ferramenta</DialogTitle>
        </DialogHeader>
        {disponiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas cadastradas já estão vinculadas a esse projeto.
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (ferramentaId) mutation.mutate()
            }}
          >
            <div className="flex flex-col gap-2">
              <Label>Ferramenta</Label>
              <Select value={ferramentaId} onValueChange={setFerramentaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma ferramenta" />
                </SelectTrigger>
                <SelectContent>
                  {disponiveis.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} {f.status === 'comprada' ? '✅' : '⚠️'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={essencial}
                onCheckedChange={(checked) => setEssencial(checked === true)}
              />
              Essencial pra esse serviço
            </label>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending || !ferramentaId}>
                {mutation.isPending ? 'Vinculando...' : 'Vincular'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
