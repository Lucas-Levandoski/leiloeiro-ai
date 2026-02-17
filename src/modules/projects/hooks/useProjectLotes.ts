import { useState, useEffect } from "react"
import { toast } from "sonner"
import { toggleLoteFavorite } from "@/actions/projects"
import { extractLoteDetails } from "@/actions/agents"
import { projectService } from "../services/ProjectService"

export function useProjectLotes(projectId: string | undefined) {
  const [lotes, setLotes] = useState<any[]>([])
  const [globalInfo, setGlobalInfo] = useState<any>(null)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)

  const handleDeleteLote = (loteId: string) => {
    setLotes(prev => prev.filter(l => l.id !== loteId))
  }

  const handleToggleFavorite = async (loteId: string, currentStatus: boolean) => {
    // Optimistic update
    setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: !currentStatus } : l))
    
    try {
        const result = await toggleLoteFavorite(loteId, !currentStatus)
        if (result.success) {
            toast.success(!currentStatus ? "Adicionado aos favoritos" : "Removido dos favoritos")
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event("project-update"))
        } else {
             // Revert
             setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: currentStatus } : l))
             toast.error("Erro ao atualizar favorito")
        }
    } catch (error) {
        // Revert
        setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: currentStatus } : l))
        console.error(error)
        toast.error("Erro ao atualizar favorito")
    }
  }

  const handleManualExtraction = async (text: string) => {
    if (!text.trim()) {
        toast.error("Por favor, insira o texto do lote.")
        return
    }

    setManualLoading(true)
    try {
        const result = await extractLoteDetails(text, globalInfo)
        
        if (result.success && result.data) {
            const newLote = {
                ...result.data,
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(7), // Temp ID
                rawContent: text,
                is_favorite: false
            }
            
            // Optimistic update
            const updatedLotes = [...lotes, newLote]
            setLotes(updatedLotes)
            
            setManualDialogOpen(false)
            toast.success("Lote adicionado com sucesso!")
            
            // Auto-save if project exists
            if (projectId) {
               try {
                   // Note: We need the current form values (name, description) to update the project
                   // But we don't have access to them here easily without passing them in or fetching again
                   // For now, we'll just fetch the current project to get name/desc to avoid overwriting with empty
                   const currentProject = await projectService.getById(projectId)
                   
                   const updated = await projectService.update(projectId, {
                       name: currentProject?.name || "",
                       description: currentProject?.description || "",
                       lotes: updatedLotes,
                       details: globalInfo
                   }, undefined)
                   
                   if (updated && updated.lotes) {
                       setLotes(updated.lotes.map((l: any) => ({
                            id: l.id,
                            title: l.title,
                            description: l.description,
                            auction_prices: l.auction_prices,
                            city: l.city,
                            state: l.state,
                            type: l.details?.type,
                            rawContent: l.details?.rawContent || l.description,
                            details: l.details,
                            is_favorite: l.is_favorite
                       })))
                   }
               } catch (saveError) {
                   console.error("Error auto-saving manual lote", saveError)
                   toast.error("Erro ao salvar o lote no projeto.")
               }
            }
        } else {
            toast.error("Não foi possível extrair informações do texto.")
        }
    } catch (error) {
        console.error(error)
        toast.error("Erro ao processar o texto.")
    } finally {
        setManualLoading(false)
    }
  }

  return {
    lotes,
    setLotes,
    globalInfo,
    setGlobalInfo,
    manualDialogOpen,
    setManualDialogOpen,
    manualLoading,
    handleDeleteLote,
    handleToggleFavorite,
    handleManualExtraction
  }
}
