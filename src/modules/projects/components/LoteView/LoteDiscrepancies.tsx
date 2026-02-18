
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";

interface LoteDiscrepanciesProps {
    lote: any;
    hasRelevantDiscrepancies: boolean;
    highestSeverity: string | null;
    getSeverityStyles: (severity: string) => any;
    handleToggleDiscrepancy: (idx: number) => void;
}

export function LoteDiscrepancies({
    lote,
    hasRelevantDiscrepancies,
    highestSeverity,
    getSeverityStyles,
    handleToggleDiscrepancy
}: LoteDiscrepanciesProps) {
    return (
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
    );
}
