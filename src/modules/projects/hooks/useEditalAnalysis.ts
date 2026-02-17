import { useState } from "react"
import { toast } from "sonner"
import { extractTextFromPDF, analyzeEditalStructure, extractLoteDetails } from "@/actions/agents"
import { projectService } from "../services/ProjectService"

interface UseEditalAnalysisProps {
  projectId?: string
  editalFile: File | null
  pageRange: string
  pageCount: number
  setLotes: (lotes: any[]) => void
  setGlobalInfo: (info: any) => void
  formValues: { name: string; description?: string }
  setFormDescription: (desc: string) => void
}

export function useEditalAnalysis({
  projectId,
  editalFile,
  pageRange,
  pageCount,
  setLotes,
  setGlobalInfo,
  formValues,
  setFormDescription
}: UseEditalAnalysisProps) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStep, setAiStep] = useState<'idle' | 'extracting_text' | 'analyzing_structure' | 'extracting_details' | 'completed'>('idle')

  const handleAiExtraction = async () => {
    if (!editalFile) {
        setAiError("Por favor, selecione um arquivo de edital primeiro.")
        return
    }

    // Validate page count selection
    let selectedPageCount = 0
    
    if (pageRange.trim()) {
        const pages = new Set<number>()
        const parts = pageRange.split(',')
        for (const part of parts) {
            const trimmed = part.trim()
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number)
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) pages.add(i)
                }
            } else {
                const page = Number(trimmed)
                if (!isNaN(page)) pages.add(page)
            }
        }
        selectedPageCount = pages.size
    } else {
        selectedPageCount = pageCount
    }

    if (selectedPageCount > 15) {
        setAiError(`Você selecionou ${selectedPageCount} páginas. O limite para análise é de 15 páginas por vez.`)
        return
    }

    setAiLoading(true)
    setAiError(null)
    setAiStep('extracting_text')
    setLotes([])
    setGlobalInfo(null)

    try {
        const formData = new FormData()
        formData.append('file', editalFile)
        if (pageRange.trim()) {
            formData.append('pages', pageRange.trim())
        }
        
        // Agent 1: Extract Text
        const textResult = await extractTextFromPDF(formData)
        
        if (!textResult.success || !textResult.text) {
            throw new Error(textResult.error || 'Falha ao extrair texto do PDF')
        }

        // Agent 2: Analyze Structure
        setAiStep('analyzing_structure')
        const structureResult = await analyzeEditalStructure(textResult.text)
        
        if (!structureResult.success || !structureResult.data) {
            throw new Error(structureResult.error || 'Falha ao analisar estrutura do edital')
        }

        const { globalInfo: gInfo, lotes: rawLotes } = structureResult.data
        
        // Ensure auctionDate is an array
        if (gInfo && gInfo.auctionDate) {
            if (!Array.isArray(gInfo.auctionDate)) {
                // Try to split if it looks like a list
                if (typeof gInfo.auctionDate === 'string') {
                    if (gInfo.auctionDate.includes('\n')) {
                        gInfo.auctionDate = gInfo.auctionDate.split('\n').filter((d: string) => d.trim().length > 0)
                    } else {
                        gInfo.auctionDate = [gInfo.auctionDate]
                    }
                } else {
                    // Fallback
                    gInfo.auctionDate = [String(gInfo.auctionDate)]
                }
            }
        }

        setGlobalInfo(gInfo)
        
        // Optional: Pre-fill description with general rules
        if (gInfo?.generalRules) {
             const currentDesc = formValues.description
             if (!currentDesc) setFormDescription(gInfo.generalRules)
        }

        // Agent 3: Extract Details for each Lote
        setAiStep('extracting_details')
        
        // Process in parallel: Start all requests at once
        const lotePromises = rawLotes.map((rawLote: any) => 
            extractLoteDetails(rawLote.rawContent, gInfo)
                .then(res => {
                    if (res.success && res.data) {
                        return {
                            ...res.data,
                            id: rawLote.id, // Keep the ID from Agent 2
                            rawContent: rawLote.rawContent
                        }
                    }
                    return null
                })
                .catch(err => {
                    console.error(`Error processing lote ${rawLote.id}:`, err)
                    return null
                })
        )

        const results = await Promise.all(lotePromises)
        const processedLotes: any[] = results.filter(lote => lote !== null)
        
        setLotes(processedLotes)
        setAiStep('completed')
        
        // Auto-save the results
        if (projectId) {
            toast.promise(
                (async () => {
                   const updated = await projectService.update(projectId, {
                       name: formValues.name,
                       description: formValues.description || "",
                       lotes: processedLotes,
                       details: gInfo
                   }, undefined) // We don't re-upload files here
                   
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
                })(),
                {
                    loading: 'Salvando resultados da análise...',
                    success: 'Análise concluída e salva com sucesso!',
                    error: 'Erro ao salvar resultados automáticos.'
                }
            )
        } else {
             toast.success("Análise concluída! Salve o projeto para persistir os dados.")
        }

    } catch (err: any) {
        setAiError(err.message || "Erro desconhecido na extração IA")
        setAiStep('idle')
    } finally {
        setAiLoading(false)
    }
  }

  return {
    aiLoading,
    aiError,
    aiStep,
    handleAiExtraction
  }
}
