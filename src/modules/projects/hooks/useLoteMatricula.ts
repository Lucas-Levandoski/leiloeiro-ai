import { useState } from "react";
import { updateLoteAction, uploadFile } from "@/actions/projects";
import { extractMatriculaData, extractTextFromPDF, analyzeRisk, compareLoteData } from "@/actions/agents";
import { toast } from "sonner";

export function useLoteMatricula(lote: any, setLote: (lote: any) => void) {
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null);
  const [matriculaLoading, setMatriculaLoading] = useState(false);
  const [isMatriculaExpanded, setIsMatriculaExpanded] = useState(false);

  const handleMatriculaProcess = async () => {
    if (!matriculaFile || !lote) return;
    setMatriculaLoading(true);
    try {
        // 1. Upload file
        const fileUrl = await uploadFile(matriculaFile);

        // 2. Extract text
        const formData = new FormData();
        formData.append('file', matriculaFile);
        const textResult = await extractTextFromPDF(formData);

        if (!textResult.success || !textResult.text) {
            throw new Error(textResult.error || "Erro ao extrair texto do PDF");
        }

        // 3. Extract data
        const dataResult = await extractMatriculaData(textResult.text);
        if (!dataResult.success || !dataResult.data) {
            throw new Error(dataResult.error || "Erro ao analisar dados da matrícula");
        }

        // 4. Analyze Risk (New Step)
        const riskResult = await analyzeRisk(lote.details, dataResult.data);
        const riskData = riskResult.success ? riskResult.data : {};

        // 5. Compare Data (New Step)
        const comparisonResult = await compareLoteData(lote.details, dataResult.data);
        const discrepancies = comparisonResult.success ? comparisonResult.data : [];

        // 6. Update lote
        const updatedDetails = {
            ...lote.details,
            matricula_url: fileUrl,
            matricula_data: dataResult.data,
            // Update risk fields
            risk_level: riskData.risk_level || lote.details.risk_level,
            risk_analysis: riskData.risk_analysis || lote.details.risk_analysis,
            is_risky: riskData.risk_level === 'high',
            discrepancies: discrepancies
        };

        const updatePayload = {
             ...updatedDetails,
             id: lote.id,
             title: lote.title
        };

        const result = await updateLoteAction(lote.id, updatePayload);
        
        if (result.success) {
            setLote({
                ...lote,
                details: updatedDetails
            });
            toast.success("Matrícula processada e risco reavaliado!");
            setIsMatriculaExpanded(true);
        } else {
            throw new Error(result.error || "Erro ao salvar dados da matrícula");
        }

    } catch (error: any) {
        console.error("Error processing matricula:", error);
        toast.error(error.message || "Erro ao processar matrícula");
    } finally {
        setMatriculaLoading(false);
    }
  };

  const handleRemoveMatricula = async () => {
      if (!lote) return;
      if (!confirm("Tem certeza que deseja remover os dados da matrícula?")) return;

      try {
          const updatedDetails = {
              ...lote.details,
              matricula_url: null,
              matricula_data: null
          };

          const updatePayload = {
              ...updatedDetails,
              id: lote.id,
              title: lote.title
          };

          const result = await updateLoteAction(lote.id, updatePayload);
          
          if (result.success) {
              setLote({
                  ...lote,
                  details: updatedDetails
              });
              setMatriculaFile(null);
              toast.success("Dados da matrícula removidos");
          }
      } catch (error) {
          toast.error("Erro ao remover dados");
      }
  };

  const handleToggleDiscrepancy = async (index: number) => {
    if (!lote || !lote.details?.discrepancies) return;
    
    const discrepancies = [...lote.details.discrepancies];
    const currentStatus = discrepancies[index].isRelevant !== false; // Default is true
    discrepancies[index].isRelevant = !currentStatus;
    
    const updatedDetails = {
        ...lote.details,
        discrepancies
    };
    
    // Optimistic update
    setLote({
        ...lote,
        details: updatedDetails
    });

    try {
        const updatePayload = {
            ...updatedDetails,
            id: lote.id,
            title: lote.title
        };
        await updateLoteAction(lote.id, updatePayload);
        toast.success(currentStatus ? "Marcada como irrelevante" : "Marcada como relevante");
    } catch (error) {
        toast.error("Erro ao salvar alteração");
         // Revert on error could be implemented here
    }
  };

  return {
    matriculaFile,
    setMatriculaFile,
    matriculaLoading,
    isMatriculaExpanded,
    setIsMatriculaExpanded,
    handleMatriculaProcess,
    handleRemoveMatricula,
    handleToggleDiscrepancy
  };
}
