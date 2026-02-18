import { useState, useEffect } from "react";
import { getLoteById } from "@/actions/projects";

export function useLoteData(loteId: string) {
  const [lote, setLote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loteId || loteId === 'undefined') {
      setLoading(false);
      return;
    }

    const fetchLote = async () => {
      try {
        const data = await getLoteById(loteId);
        setLote(data);
      } catch (error) {
        console.error("Error fetching lote:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLote();
  }, [loteId]);

  return { lote, setLote, loading };
}
