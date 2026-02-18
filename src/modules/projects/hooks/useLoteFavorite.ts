import { useState, useEffect } from "react";
import { toggleLoteFavorite } from "@/actions/projects";
import { toast } from "sonner";

export function useLoteFavorite(loteId: string, initialFavoriteStatus: boolean) {
  const [isFavorite, setIsFavorite] = useState(initialFavoriteStatus);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(initialFavoriteStatus);
  }, [initialFavoriteStatus]);

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const newStatus = !isFavorite;
      const result = await toggleLoteFavorite(loteId, newStatus);
      if (result.success) {
        setIsFavorite(newStatus);
        toast.success(newStatus ? "Adicionado aos favoritos" : "Removido dos favoritos");
        window.dispatchEvent(new Event("project-update"));
      } else {
        toast.error("Erro ao atualizar favorito");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar favorito");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return { isFavorite, favoriteLoading, handleToggleFavorite };
}
