import { useState } from "react";
import { updateLoteAction } from "@/actions/projects";
import { extractLoteDetails } from "@/actions/agents";
import { toast } from "sonner";

export function useLoteAI(lote: any, setLote: (lote: any) => void) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiReanalysis = async () => {
    if (!lote || !lote.details?.rawContent) {
        toast.error("Conteúdo original não disponível para reanálise");
        return;
    }

    setAiLoading(true);
    try {
        const result = await extractLoteDetails(lote.details.rawContent, lote.projects?.details);
        
        if (result.success && result.data) {
            const updatedData = {
                ...lote.details, // Keep existing fields just in case
                ...result.data,
                id: lote.id,
                rawContent: lote.details.rawContent // Ensure raw content is preserved
            };

            // Save to database
            const saveResult = await updateLoteAction(lote.id, updatedData);
            
            if (saveResult.success) {
                setLote({
                    ...lote,
                    ...updatedData, // Update local state fields like city, state, etc.
                    details: updatedData
                });
                toast.success("Análise atualizada com sucesso!");
                window.dispatchEvent(new Event("project-update"));
            } else {
                throw new Error(saveResult.error || "Erro ao salvar atualização");
            }
        } else {
            throw new Error(result.error || "Falha na análise da IA");
        }
    } catch (error: any) {
        console.error("Error re-analyzing lote:", error);
        toast.error(error.message || "Erro ao reanalisar o lote");
    } finally {
        setAiLoading(false);
    }
  };

  return { aiLoading, handleAiReanalysis };
}
