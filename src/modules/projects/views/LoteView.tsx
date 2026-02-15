'use client'

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getLoteById, toggleLoteFavorite, updateLoteAction } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building2, MapPin, DollarSign, FileText, Star, Gavel, Calendar, ExternalLink, Landmark, Sparkles, Edit, Save, X, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
    import { BankLogo } from "@/components/BankLogo";
import { extractLoteDetails, extractMatriculaData, extractTextFromPDF, analyzeRisk, compareLoteData } from "@/actions/agents";
import { MatriculaCard } from "@/modules/projects/components/MatriculaCard";
import { FinancialCalculator } from "@/modules/projects/components/FinancialCalculator";
import { MarketAnalysisSection } from "@/modules/projects/components/MarketAnalysis/MarketAnalysisSection";
import { uploadFile } from "@/actions/projects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Upload, FileText as FileTextIcon, RefreshCw, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LoteViewProps {
  loteId: string;
  projectId: string;
}

export default function LoteView({ loteId, projectId }: LoteViewProps) {
  const [lote, setLote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  
  // Matricula state
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null);
  const [matriculaLoading, setMatriculaLoading] = useState(false);
  const [isMatriculaExpanded, setIsMatriculaExpanded] = useState(false);

  useEffect(() => {
    if (!loteId || loteId === 'undefined') {
        setLoading(false);
        return;
    }

    const fetchLote = async () => {
      try {
        const data = await getLoteById(loteId);
        setLote(data);
        setIsFavorite(data?.is_favorite || false);
        setDescriptionValue(data?.description || data?.details?.rawContent || "");
      } catch (error) {
        console.error("Error fetching lote:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLote();
  }, [loteId]);

  const handleSaveDescription = async () => {
    if (!lote) return;
    
    setIsSavingDescription(true);
    try {
        const updatedDetails = {
            ...lote.details,
            description: descriptionValue,
            rawContent: descriptionValue // Also update rawContent as it's used as fallback
        };
        
        // We need to pass the full object structure expected by updateLoteAction
        // The action expects an object that will be used to update both columns and details JSON
        const updatePayload = {
            ...updatedDetails,
            id: lote.id,
            title: lote.title, // Preserve title
            // Add other fields if necessary to preserve them in top-level columns
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

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
        const newStatus = !isFavorite;
        const result = await toggleLoteFavorite(loteId, newStatus);
        if (result.success) {
            setIsFavorite(newStatus);
            toast.success(newStatus ? "Adicionado aos favoritos" : "Removido dos favoritos");
            // Dispatch event to update sidebar
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
  }, []);

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


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Lote não encontrado.</p>
        <Button asChild>
            <Link href={`/portal/projects/${projectId}`}>Voltar</Link>
        </Button>
      </div>
    );
  }

  const hasRelevantDiscrepancies = lote.details?.discrepancies?.some((d: any) => d.isRelevant !== false);
  
  // Calculate highest severity among relevant discrepancies
  const getHighestSeverity = () => {
    if (!lote.details?.discrepancies) return null;
    
    const relevantDiscrepancies = lote.details.discrepancies.filter((d: any) => d.isRelevant !== false);
    if (relevantDiscrepancies.length === 0) return null;
    
    const hasHigh = relevantDiscrepancies.some((d: any) => d.severity?.toLowerCase() === 'high');
    if (hasHigh) return 'high';
    
    const hasMedium = relevantDiscrepancies.some((d: any) => d.severity?.toLowerCase() === 'medium');
    if (hasMedium) return 'medium';
    
    return 'low';
  };

  const highestSeverity = getHighestSeverity();

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
        case 'high':
            return {
                border: 'border-red-200 dark:border-red-800',
                text: 'text-red-800 dark:text-red-300',
                label: 'text-red-700 dark:text-red-400',
                decoration: 'decoration-red-300',
                hover: 'hover:text-red-600',
                bg: 'bg-red-50/50 dark:bg-red-900/10',
                badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
                label_text: 'Alta'
            };
        case 'low':
            return {
                border: 'border-blue-200 dark:border-blue-800',
                text: 'text-blue-800 dark:text-blue-300',
                label: 'text-blue-700 dark:text-blue-400',
                decoration: 'decoration-blue-300',
                hover: 'hover:text-blue-600',
                bg: 'bg-blue-50/50 dark:bg-blue-900/10',
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
                label_text: 'Baixa'
            };
        case 'medium':
        default:
            return {
                border: 'border-orange-200 dark:border-orange-800',
                text: 'text-orange-800 dark:text-orange-300',
                label: 'text-orange-700 dark:text-orange-400',
                decoration: 'decoration-orange-300',
                hover: 'hover:text-orange-600',
                bg: 'bg-orange-50/50 dark:bg-orange-900/10',
                badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
                label_text: 'Média'
            };
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-6 pb-0">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
                <Link href={`/portal/projects/${projectId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Projeto
                </Link>
            </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <div className="max-w-4xl mx-auto space-y-6 pb-10">

        {/* Auction Info Card */}
        {lote.projects?.details && (
            <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
                    {lote.projects.details.bankName && (
                        <div className="flex-shrink-0 bg-white dark:bg-slate-950 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm">
                            <BankLogo bankName={lote.projects.details.bankName} size="lg" />
                        </div>
                    )}
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-lg">
                            <Gavel className="h-5 w-5" />
                            <span>Informações do Leilão</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                             {lote.projects.details.auctionDate && (
                                <div className="md:col-span-2 bg-white/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-800 p-4">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-200">
                                        <Calendar className="h-5 w-5" />
                                        <span className="font-semibold">Cronograma do Leilão</span>
                                    </div>
                                    <div className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-line leading-relaxed pl-1">
                                      <div className="flex flex-col gap-1">
                                          {lote.projects.details.auctionDate.map((date: string, idx: number) => (
                                              <div key={idx} className="flex items-start gap-2">
                                                  <span className="text-indigo-400 dark:text-indigo-500">•</span>
                                                  <span>{date}</span>
                                              </div>
                                          ))}
                                      </div>
                                     </div>
                                </div>
                             )}
                             {lote.projects.details.auctionLocation && (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    {lote.projects.details.auctionLocation.match(/^(https?:\/\/|www\.)|(\.com|\.br|\.net|\.org)/i) ? (
                                        <a 
                                            href={lote.projects.details.auctionLocation.startsWith('http') ? lote.projects.details.auctionLocation : `https://${lote.projects.details.auctionLocation}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="truncate hover:underline flex items-center gap-1"
                                        >
                                            <span className="truncate">{lote.projects.details.auctionLocation}</span>
                                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                                        </a>
                                    ) : (
                                        <span className="truncate">{lote.projects.details.auctionLocation}</span>
                                    )}
                                </div>
                             )}
                             {lote.projects.details.auctioneer && (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 md:col-span-2">
                                    <span className="font-medium">Leiloeiro:</span>
                                    <span>{lote.projects.details.auctioneer}</span>
                                </div>
                             )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Risk Assessment Alert */}
        {(lote.details?.risk_level || lote.details?.is_risky || lote.details?.risk_analysis) && (
            <Alert 
                variant={
                    lote.details?.risk_level === "high" || lote.details?.is_risky === true ? "destructive" : 
                    lote.details?.risk_level === "medium" ? "default" : 
                    "default"
                } 
                className={
                    lote.details?.risk_level === "high" || lote.details?.is_risky === true ? "border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200" :
                    lote.details?.risk_level === "medium" ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200" :
                    lote.details?.risk_level === "low" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200" :
                    "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }
            >
                <AlertTriangle className={
                    lote.details?.risk_level === "high" || lote.details?.is_risky === true ? "text-red-900 dark:text-red-200" :
                    lote.details?.risk_level === "medium" ? "text-yellow-900 dark:text-yellow-200" :
                    lote.details?.risk_level === "low" ? "text-green-900 dark:text-green-200" :
                    "text-gray-900 dark:text-gray-200"
                } />
                <AlertTitle className="flex items-center gap-2">
                    Análise de Risco
                    {lote.details?.risk_level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            lote.details.risk_level === "high" ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100" :
                            lote.details.risk_level === "medium" ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                            "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100"
                        }`}>
                            {lote.details.risk_level === "high" ? "Alto Risco" : 
                             lote.details.risk_level === "medium" ? "Médio Risco" : 
                             "Baixo Risco"}
                        </span>
                    )}
                </AlertTitle>
                <AlertDescription className="mt-2">
                    {lote.details?.risk_analysis || "Este lote apresenta características que podem indicar riscos. Verifique as informações detalhadamente."}
                </AlertDescription>
            </Alert>
        )}

        {/* Data Discrepancy Alert */}
        {/* Removed redundant alert */}

        <Card>
            <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-bold text-foreground">{lote.title}</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                            <Star className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAiReanalysis}
                            disabled={aiLoading}
                            className="ml-2 gap-2 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                            {aiLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Reanalisar com IA
                        </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                        <span className="text-muted-foreground">Criado em: {new Date(lote.created_at).toLocaleDateString()}</span>
                    </CardDescription>
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Price Section */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-3">
                            <DollarSign className="h-4 w-4" />
                            Valores de Leilão
                        </div>
                        {lote.auction_prices && lote.auction_prices.length > 0 ? (
                            <div className="space-y-3">
                                {lote.auction_prices.map((price: any, idx: number) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-green-200 dark:border-green-800 last:border-0 pb-2 last:pb-0">
                                        <span className="text-green-800 dark:text-green-300 text-sm font-medium uppercase tracking-wide">{price.label}</span>
                                        <span className="text-xl font-bold text-green-900 dark:text-green-100">{price.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-lg text-muted-foreground">
                                Valores não informados
                            </div>
                        )}
                    </div>
                </div>

                {lote.details?.legal_actions && lote.details.legal_actions.length > 0 && (
                        <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Gavel className="h-4 w-4" /> Ações Judiciais
                        </h3>
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-100 dark:border-red-900 text-sm text-red-800 dark:text-red-300">
                            <ul className="list-disc pl-5 space-y-1">
                                {lote.details.legal_actions.map((action: string, idx: number) => (
                                    <li key={idx}>{action}</li>
                                ))}
                            </ul>
                        </div>
                        </div>
                )}
                
                <Separator />

                <Accordion type="multiple" className="w-full space-y-4">
                    <AccordionItem value="discrepancies" className="border rounded-lg bg-orange-50/30 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-orange-900 dark:text-orange-200">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-semibold text-lg">Discrepâncias Encontradas</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ml-2 ${
                                    !lote.details?.matricula_data 
                                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" 
                                        : (!lote.details.discrepancies || lote.details.discrepancies.length === 0) 
                                            ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100"
                                            : hasRelevantDiscrepancies
                                                ? "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                                                : "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                }`}>
                                    {!lote.details?.matricula_data 
                                        ? "Aguardando Matrícula" 
                                        : (!lote.details.discrepancies || lote.details.discrepancies.length === 0) 
                                            ? "Sem Discrepâncias"
                                            : hasRelevantDiscrepancies
                                                ? (
                                                    <span className="flex items-center gap-1">
                                                        Atenção: Severidade {highestSeverity === 'high' ? 'Alta' : highestSeverity === 'medium' ? 'Média' : 'Baixa'}
                                                    </span>
                                                )
                                                : "Discrepâncias Irrelevantes"
                                    }
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-4">
                                {!lote.details?.matricula_data ? (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 rounded border border-yellow-200 dark:border-yellow-800 text-sm">
                                        Envie a matrícula para análise para identificar possíveis discrepâncias.
                                    </div>
                                ) : (!lote.details.discrepancies || lote.details.discrepancies.length === 0) ? (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800 flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4" /> Nenhuma irregularidade cadastral encontrada.
                                    </div>
                                ) : (
                                    <>
                                        {!hasRelevantDiscrepancies && (
                                            <div className="p-3 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800 flex items-center gap-2 text-sm mb-4">
                                                <Check className="h-4 w-4" /> Sem maiores problemas cadastrais (Discrepâncias marcadas como irrelevantes).
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {lote.details.discrepancies.map((d: any, idx: number) => {
                                                const isRelevant = d.isRelevant !== false;
                                                const styles = getSeverityStyles(d.severity);
                                                return (
                                                    <div key={idx} className={`text-sm border-b ${styles.border} last:border-0 pb-2 last:pb-0 ${!isRelevant ? 'opacity-60' : ''}`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold block">{d.field}:</span>
                                                                {isRelevant && (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${styles.badge}`}>
                                                                        {styles.label_text}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => handleToggleDiscrepancy(idx)}
                                                                className={`h-6 px-2 text-xs gap-1.5 ${isRelevant ? `text-muted-foreground ${styles.hover}` : 'text-green-600 hover:text-green-700'}`}
                                                                title={isRelevant ? "Marcar como irrelevante" : "Marcar como relevante"}
                                                            >
                                                                {isRelevant ? (
                                                                    <>
                                                                        <EyeOff className="h-3 w-3" />
                                                                        <span className="sr-only">Ignorar</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye className="h-3 w-3" />
                                                                        <span className="sr-only">Considerar</span>
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <div className={`grid grid-cols-2 gap-2 mt-1 ${styles.bg} p-2 rounded`}>
                                                            <div>
                                                                <span className={`text-xs uppercase font-bold ${styles.label} block mb-0.5`}>Edital:</span>
                                                                <div className={`font-medium break-words ${!isRelevant ? `line-through ${styles.decoration}` : ''}`}>{d.editalValue || "N/A"}</div>
                                                            </div>
                                                            <div>
                                                                <span className={`text-xs uppercase font-bold ${styles.label} block mb-0.5`}>Matrícula:</span>
                                                                <div className={`font-medium break-words ${!isRelevant ? `line-through ${styles.decoration}` : ''}`}>{d.matriculaValue || "N/A"}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`text-xs mt-1.5 ${styles.text} italic`}>
                                                            "{d.message}"
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="details" className="border rounded-lg bg-card px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <span className="font-semibold text-lg">Detalhes do Imóvel e Localização</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Localização Detalhada
                                    </h3>
                                    <div className="space-y-2 text-muted-foreground text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Logradouro:</span> {lote.details?.address_street || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Número:</span> {lote.details?.address_number || "-"}</div>
                                        </div>
                                        <div><span className="font-medium text-foreground block">Complemento:</span> {lote.details?.address_complement || "-"}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Bairro:</span> {lote.details?.neighborhood || "-"}</div>
                                            <div><span className="font-medium text-foreground block">CEP:</span> {lote.details?.address_zip || "-"}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Cidade:</span> {lote.city || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Estado:</span> {lote.state || "-"}</div>
                                        </div>
                                        <div className="pt-2 border-t mt-2">
                                            <span className="font-medium text-foreground block mb-1">Endereço Completo:</span> 
                                            {lote.details?.address || "-"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4" /> Detalhes do Imóvel
                                    </h3>
                                    <div className="space-y-2 text-muted-foreground text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Tipo:</span> {lote.details?.type || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Ocupação:</span> {lote.details?.occupancy_status || "-"}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Lote:</span> {lote.details?.lot || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Quadra:</span> {lote.details?.block || "-"}</div>
                                        </div>
                                        <div><span className="font-medium text-foreground block">Condomínio:</span> {lote.details?.condominium_name || "-"}</div>
                                        <div><span className="font-medium text-foreground block">Loteamento:</span> {lote.details?.subdivision_name || "-"}</div>
                                         <div><span className="font-medium text-foreground block">Vagas de Garagem:</span> {lote.details?.parking_spaces || "-"}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Landmark className="h-4 w-4" /> Dados Registrais
                                    </h3>
                                    <div className="space-y-2 text-muted-foreground text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Matrícula:</span> {lote.details?.registry_id || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Cartório:</span> {lote.details?.registry_office || "-"}</div>
                                        </div>
                                        <div><span className="font-medium text-foreground block">Inscrição Municipal:</span> {lote.details?.city_registration_id || "-"}</div>
                                        <div><span className="font-medium text-foreground block">Fração Ideal:</span> {lote.details?.ideal_fraction || "-"}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" /> Áreas
                                    </h3>
                                     <div className="space-y-2 text-muted-foreground text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="font-medium text-foreground block">Área Privativa:</span> {lote.details?.area_private || "-"}</div>
                                            <div><span className="font-medium text-foreground block">Área Total:</span> {lote.details?.area_total || "-"}</div>
                                        </div>
                                        <div><span className="font-medium text-foreground block">Área Terreno:</span> {lote.details?.area_land || "-"}</div>
                                        <div><span className="font-medium text-foreground block">Área (Genérica):</span> {lote.details?.size || "-"}</div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="matricula" className="border rounded-lg bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 px-4">
                        <AccordionTrigger className="hover:no-underline">
                             <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                                <FileTextIcon className="h-5 w-5" />
                                <span className="font-semibold text-lg">Matrícula</span>
                                {(lote.details?.matricula_url || lote.details?.matricula_data) && (
                                    <span className="flex items-center gap-1 ml-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">
                                        <Check className="h-3 w-3" />
                                        Anexada
                                    </span>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <MatriculaCard 
                                lote={lote}
                                file={matriculaFile}
                                setFile={setMatriculaFile}
                                loading={matriculaLoading}
                                onProcess={handleMatriculaProcess}
                                onRemove={handleRemoveMatricula}
                                isExpanded={true}
                                setIsExpanded={setIsMatriculaExpanded}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="financial" className="border rounded-lg bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800 px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-green-900 dark:text-green-200">
                                <DollarSign className="h-5 w-5" />
                                <span className="font-semibold text-lg">Análise Financeira</span>
                                {(lote.details?.financial_roi !== undefined && lote.details?.financial_roi !== null) && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold tracking-wider ml-2 ${
                                        Number(lote.details.financial_roi) >= 50 ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100" :
                                        Number(lote.details.financial_roi) >= 20 ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                                        Number(lote.details.financial_roi) >= 0 ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                                        "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100"
                                    }`}>
                                        ROI: {Number(lote.details.financial_roi).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <FinancialCalculator 
                                details={lote.details}
                                auctionPrices={lote.auction_prices}
                                onSave={handleFinancialSave}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="market" className="border rounded-lg bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                                <Sparkles className="h-5 w-5" />
                                <span className="font-semibold text-lg">Análise de Mercado</span>
                                {lote.details?.market_average_price > 0 && (
                                    <span className="text-xs bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 px-2 py-0.5 rounded-full font-bold tracking-wider ml-2">
                                        ~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lote.details.market_average_price)}
                                    </span>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <MarketAnalysisSection 
                                loteId={lote.id} 
                                onAnalysisUpdate={handleMarketAnalysisUpdate}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="description" className="border rounded-lg bg-card px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span className="font-semibold text-lg">Descrição Completa</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Texto da Descrição
                                    </h3>
                                    {!isEditingDescription ? (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setIsEditingDescription(true)}
                                            className="h-8 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    setIsEditingDescription(false);
                                                    setDescriptionValue(lote.description || lote.details?.rawContent || "");
                                                }}
                                                disabled={isSavingDescription}
                                                className="h-8"
                                            >
                                                <X className="h-4 w-4 mr-2" /> Cancelar
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                onClick={handleSaveDescription}
                                                disabled={isSavingDescription}
                                                className="h-8"
                                            >
                                                {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                                Salvar
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {isEditingDescription ? (
                                    <Textarea 
                                        value={descriptionValue} 
                                        onChange={(e) => setDescriptionValue(e.target.value)}
                                        className="min-h-[300px] font-mono text-sm"
                                        placeholder="Digite a descrição do lote..."
                                    />
                                ) : (
                                    <div className="bg-gray-50 dark:bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {lote.description || lote.details?.rawContent || "Sem descrição disponível."}
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
