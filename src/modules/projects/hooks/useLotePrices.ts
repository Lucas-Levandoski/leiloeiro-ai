import { useState, useEffect } from "react";
import { updateLoteAction } from "@/actions/projects";
import { toast } from "sonner";

export function useLotePrices(lote: any, setLote: (lote: any) => void) {
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [pricesForm, setPricesForm] = useState<any[]>([]);
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  useEffect(() => {
    if (lote && !isEditingPrices) {
      setPricesForm(lote.auction_prices || []);
    }
  }, [lote, isEditingPrices]);

  const handleSavePrices = async () => {
    if (!lote) return;
    
    setIsSavingPrices(true);
    try {
        const updatePayload = {
            ...lote.details,
            id: lote.id,
            title: lote.title,
            auction_prices: pricesForm
        };

        const result = await updateLoteAction(lote.id, updatePayload);
        
        if (result.success) {
            setLote({
                ...lote,
                auction_prices: pricesForm
            });
            setIsEditingPrices(false);
            toast.success("Preços atualizados com sucesso!");
            window.dispatchEvent(new Event("project-update"));
        } else {
            throw new Error(result.error || "Erro ao salvar preços");
        }
    } catch (error: any) {
        console.error("Error saving prices:", error);
        toast.error(error.message || "Erro ao salvar preços");
    } finally {
        setIsSavingPrices(false);
    }
  };

  const addPrice = () => {
    setPricesForm([...pricesForm, { label: "Valor", value: "" }]);
  };

  const removePrice = (index: number) => {
    const newPrices = [...pricesForm];
    newPrices.splice(index, 1);
    setPricesForm(newPrices);
  };

  const updatePrice = (index: number, field: string, value: string) => {
    const newPrices = [...pricesForm];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPricesForm(newPrices);
  };

  return {
    isEditingPrices,
    setIsEditingPrices,
    pricesForm,
    setPricesForm,
    isSavingPrices,
    handleSavePrices,
    addPrice,
    removePrice,
    updatePrice
  };
}
