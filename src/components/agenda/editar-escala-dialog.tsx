import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { EscalaForm } from '#/components/agenda/escala-form'

export function EditarEscalaDialog({ dataAtual }: { dataAtual: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar data de referência">
          <Settings className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data de referência do plantão</DialogTitle>
        </DialogHeader>
        <EscalaForm defaultValue={dataAtual} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
