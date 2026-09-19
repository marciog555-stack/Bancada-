import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { salvarConfiguracaoEscala } from '#/lib/server/escala'

export function EscalaForm({
  defaultValue,
  onSaved,
}: {
  defaultValue?: string
  onSaved?: () => void
}) {
  const [data, setData] = useState(defaultValue ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (dataPlantaoReferencia: string) =>
      salvarConfiguracaoEscala({ data: { dataPlantaoReferencia } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['configuracao-escala'] })
      toast.success('Data de referência salva.')
      onSaved?.()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (data) mutation.mutate(data)
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="data-referencia">Data de um dia que você entrou de plantão</Label>
        <Input
          id="data-referencia"
          type="date"
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Qualquer plantão já trabalhado serve de referência — o sistema calcula o
          resto (12x36, dia sim dia não) a partir dela.
        </p>
      </div>
      <Button type="submit" disabled={mutation.isPending || !data}>
        {mutation.isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}
