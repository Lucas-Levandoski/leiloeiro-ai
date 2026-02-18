import { useState, useEffect } from "react";
import { updateLoteAction } from "@/actions/projects";
import { toast } from "sonner";

export function useLoteDescription(lote: any, setLote: (lote: any) => void) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  useEffect(() => {
    if (lote && !isEditingDescription) {
      setDescriptionValue(lote.description || lote.details?.rawContent || "");
    }
  }, [lote, isEditingDescription]);

  const handleSaveDescription = async () => {
    if (!lote) return;
    
    setIsSavingDescription(true);
    try {
        const updatedDetails = {
            ...lote.details,
            description: descriptionValue,
            rawContent: descriptionValue
        };
        
        const updatePayload = {
            ...updatedDetails,
            id: lote.id,
            title: lote.title,
        };

        const result = await updateLoteAction(lote.id, updatePayload);
        
        if (result.success) {
            setLote({
                ...lote,
                description: descriptionValue,
                details: updatedDetails
            });
            setIsEditingDescription(false);
            toast.success("Descrição atualizada com sucesso!");
            window.dispatchEvent(new Event("project-update"));
        } else {
            throw new Error(result.error || "Erro ao salvar descrição");
        }
    } catch (error: any) {
        console.error("Error saving description:", error);
        toast.error(error.message || "Erro ao salvar descrição");
    } finally {
        setIsSavingDescription(false);
    }
  };

  return {
    isEditingDescription,
    setIsEditingDescription,
    descriptionValue,
    setDescriptionValue,
    isSavingDescription,
    handleSaveDescription
  };
}
