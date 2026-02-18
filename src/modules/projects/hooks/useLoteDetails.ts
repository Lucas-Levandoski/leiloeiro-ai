import { useState, useEffect } from "react";
import { updateLoteAction } from "@/actions/projects";
import { toast } from "sonner";

export function useLoteDetails(lote: any, setLote: (lote: any) => void) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState<any>({});
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Sync form with lote details when lote changes, but only if not editing
  // to avoid overwriting user's unsaved changes.
  useEffect(() => {
    if (lote && !isEditingDetails) {
      setDetailsForm(lote.details || {});
    }
  }, [lote, isEditingDetails]);

  // Special sync for market_average_price which can change in background
  useEffect(() => {
      if (lote?.details?.market_average_price) {
          setDetailsForm((prev: any) => ({
              ...prev,
              market_average_price: lote.details.market_average_price
          }));
      }
  }, [lote?.details?.market_average_price]);

  const handleSaveDetails = async () => {
    if (!lote) return;
    
    setIsSavingDetails(true);
    try {
        const updatedDetails = {
            ...lote.details,
            ...detailsForm
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
                details: updatedDetails
            });
            setIsEditingDetails(false);
            toast.success("Detalhes atualizados com sucesso!");
            window.dispatchEvent(new Event("project-update"));
        } else {
            throw new Error(result.error || "Erro ao salvar detalhes");
        }
    } catch (error: any) {
        console.error("Error saving details:", error);
        toast.error(error.message || "Erro ao salvar detalhes");
    } finally {
        setIsSavingDetails(false);
    }
  };

  const updateDetail = (field: string, value: string) => {
    setDetailsForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return {
    isEditingDetails,
    setIsEditingDetails,
    detailsForm,
    setDetailsForm,
    isSavingDetails,
    handleSaveDetails,
    updateDetail
  };
}
