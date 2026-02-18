import { useCallback } from "react";
import { updateLoteAction } from "@/actions/projects";

export function useLoteFinancial(lote: any, setLote: (lote: any) => void) {

  const handleFinancialSave = async (updatedDetails: any) => {
    if (!lote) return;
    
    // Create the update payload matching the structure expected by updateLoteAction
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
        window.dispatchEvent(new Event("project-update"));
    } else {
        throw new Error(result.error || "Erro ao salvar informações financeiras");
    }
  };

  const handleMarketAnalysisUpdate = useCallback((averagePrice: number) => {
    setLote((prev: any) => {
        if (!prev) return prev;
        
        // Break the loop if value is already set
        if (prev.details?.market_average_price === averagePrice) {
            return prev;
        }

        const updatedDetails = {
            ...prev.details,
            market_average_price: averagePrice
        };
        
        // Save to backend
        updateLoteAction(prev.id, {
            ...updatedDetails,
            id: prev.id,
            title: prev.title
        }).catch(console.error);

        return {
            ...prev,
            details: updatedDetails
        };
    });
  }, [setLote]);

  return { handleFinancialSave, handleMarketAnalysisUpdate };
}
