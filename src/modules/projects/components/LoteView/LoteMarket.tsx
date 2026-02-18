
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketAnalysisSection } from "@/modules/projects/components/MarketAnalysis/MarketAnalysisSection";
import { Sparkles } from "lucide-react";

interface LoteMarketProps {
    lote: any;
    handleMarketAnalysisUpdate: (analysis: any) => void;
}

export function LoteMarket({
    lote,
    handleMarketAnalysisUpdate
}: LoteMarketProps) {
    return (
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
    );
}
