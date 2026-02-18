'use client'

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, DollarSign, Star, Gavel, Sparkles, Save, X, Pencil, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AuctionInfoCard } from "@/modules/projects/components/AuctionInfoCard";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/accordion";

import { useLoteData } from "@/modules/projects/hooks/useLoteData";
import { useLoteFavorite } from "@/modules/projects/hooks/useLoteFavorite";
import { useLoteDescription } from "@/modules/projects/hooks/useLoteDescription";
import { useLoteDetails } from "@/modules/projects/hooks/useLoteDetails";
import { useLotePrices } from "@/modules/projects/hooks/useLotePrices";
import { useLoteAI } from "@/modules/projects/hooks/useLoteAI";
import { useLoteMatricula } from "@/modules/projects/hooks/useLoteMatricula";
import { useLoteFinancial } from "@/modules/projects/hooks/useLoteFinancial";
import { useLoteSeverity } from "@/modules/projects/hooks/useLoteSeverity";
import { RiskAssessmentAlert } from "../components/RiskAssessmentAlert";

import { LoteDiscrepancies } from "../components/LoteView/LoteDiscrepancies";
import { LoteDetails } from "../components/LoteView/LoteDetails";
import { LoteMatricula } from "../components/LoteView/LoteMatricula";
import { LoteFinancial } from "../components/LoteView/LoteFinancial";
import { LoteMarket } from "../components/LoteView/LoteMarket";
import { LoteDescription } from "../components/LoteView/LoteDescription";

interface LoteViewProps {
  loteId: string;
  projectId: string;
}

export default function LoteView({ loteId, projectId }: LoteViewProps) {
  // 1. Data Fetching
  const { lote, setLote, loading } = useLoteData(loteId);

  // 2. Favorite Management
  const { isFavorite, favoriteLoading, handleToggleFavorite } = useLoteFavorite(loteId, lote?.is_favorite || false);

  // 3. Description Management
  const { 
    isEditingDescription, setIsEditingDescription, descriptionValue, setDescriptionValue, isSavingDescription, handleSaveDescription 
  } = useLoteDescription(lote, setLote);

  // 4. Details Management
  const {
    isEditingDetails, setIsEditingDetails, detailsForm, setDetailsForm, isSavingDetails, handleSaveDetails, updateDetail
  } = useLoteDetails(lote, setLote);

  // 5. Prices Management
  const {
    isEditingPrices, setIsEditingPrices, pricesForm, setPricesForm, isSavingPrices, handleSavePrices, addPrice, removePrice, updatePrice
  } = useLotePrices(lote, setLote);

  // 6. AI Reanalysis
  const { aiLoading, handleAiReanalysis } = useLoteAI(lote, setLote);

  // 7. Matricula Management
  const {
    matriculaFile, setMatriculaFile, matriculaLoading, isMatriculaExpanded, setIsMatriculaExpanded, handleMatriculaProcess, handleRemoveMatricula, handleToggleDiscrepancy
  } = useLoteMatricula(lote, setLote);

  // 8. Financial & Market
  const { handleFinancialSave, handleMarketAnalysisUpdate } = useLoteFinancial(lote, setLote);

  // 9. Severity Analysis
  const { hasRelevantDiscrepancies, highestSeverity, getSeverityStyles } = useLoteSeverity(lote);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lote) {
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
             <div className="flex-1 p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <h1 className="text-2xl font-bold text-foreground">Lote não encontrado</h1>
                    <p className="text-muted-foreground">O lote que você está tentando acessar não existe ou foi removido.</p>
                    <Button asChild>
                        <Link href={`/portal/projects/${projectId}`}>Voltar para o Projeto</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
  }


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
            <AuctionInfoCard details={lote.projects.details} />
        )}

        {/* Risk Assessment Alert */}
        {(lote.details?.risk_level || lote.details?.is_risky || lote.details?.risk_analysis) && (
            <RiskAssessmentAlert details={lote.details} />
        )}

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
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 relative">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                Valores de Leilão
                            </div>
                            {!isEditingPrices ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingPrices(true)}
                                    className="h-8 w-8 p-0 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsEditingPrices(false);
                                            setPricesForm(lote.auction_prices || []);
                                        }}
                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSavePrices}
                                        disabled={isSavingPrices}
                                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                                    >
                                        {isSavingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isEditingPrices ? (
                            <div className="space-y-3">
                                {pricesForm.map((price: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            value={price.label}
                                            onChange={(e) => updatePrice(idx, 'label', e.target.value)}
                                            placeholder="Rótulo (ex: 1º Leilão)"
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Input
                                            value={price.value}
                                            onChange={(e) => updatePrice(idx, 'value', e.target.value)}
                                            placeholder="Valor (ex: R$ 100.000,00)"
                                            className="flex-1 h-8 text-sm font-bold text-green-700"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePrice(idx)}
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addPrice}
                                    className="w-full h-8 text-xs border-dashed"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar Valor
                                </Button>
                            </div>
                        ) : (
                            lote.auction_prices && lote.auction_prices.length > 0 ? (
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
                            )
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
                    <LoteDiscrepancies 
                        lote={lote}
                        hasRelevantDiscrepancies={hasRelevantDiscrepancies}
                        highestSeverity={highestSeverity}
                        getSeverityStyles={getSeverityStyles}
                        handleToggleDiscrepancy={handleToggleDiscrepancy}
                    />

                    <LoteDetails 
                        lote={lote}
                        isEditingDetails={isEditingDetails}
                        setIsEditingDetails={setIsEditingDetails}
                        detailsForm={detailsForm}
                        setDetailsForm={setDetailsForm}
                        isSavingDetails={isSavingDetails}
                        handleSaveDetails={handleSaveDetails}
                        updateDetail={updateDetail}
                    />

                    <LoteMatricula 
                        lote={lote}
                        matriculaFile={matriculaFile}
                        setMatriculaFile={setMatriculaFile}
                        matriculaLoading={matriculaLoading}
                        handleMatriculaProcess={handleMatriculaProcess}
                        handleRemoveMatricula={handleRemoveMatricula}
                        setIsMatriculaExpanded={setIsMatriculaExpanded}
                    />

                    <LoteFinancial 
                        lote={lote}
                        handleFinancialSave={handleFinancialSave}
                    />

                    <LoteMarket 
                        lote={lote}
                        handleMarketAnalysisUpdate={handleMarketAnalysisUpdate}
                    />

                    <LoteDescription 
                        lote={lote}
                        isEditingDescription={isEditingDescription}
                        setIsEditingDescription={setIsEditingDescription}
                        descriptionValue={descriptionValue}
                        setDescriptionValue={setDescriptionValue}
                        isSavingDescription={isSavingDescription}
                        handleSaveDescription={handleSaveDescription}
                    />
                </Accordion>

            </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
