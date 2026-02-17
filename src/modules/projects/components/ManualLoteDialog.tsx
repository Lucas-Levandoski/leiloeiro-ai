import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ManualLoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProcess: (text: string) => void
  loading: boolean
}

export function ManualLoteDialog({ 
  open, 
  onOpenChange, 
  onProcess, 
  loading 
}: ManualLoteDialogProps) {
  const [text, setText] = useState("")

  const handleProcess = () => {
    if (!text.trim()) {
      toast.error("Por favor, insira o texto do lote.")
      return
    }
    onProcess(text)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setText("") // Reset text when closing
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Lote Manualmente</DialogTitle>
          <DialogDescription>
            Cole o texto completo do lote aqui para que a IA possa analisar e extrair as informações.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Cole aqui a descrição do lote (ex: Lote 01 - Apartamento..."
            className="min-h-[200px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleProcess} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Processar com IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
