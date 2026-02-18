import { useMemo } from "react";

export function useLoteSeverity(lote: any) {
  
  const hasRelevantDiscrepancies = useMemo(() => {
    return lote?.details?.discrepancies?.some((d: any) => d.isRelevant !== false);
  }, [lote?.details?.discrepancies]);

  // Calculate highest severity among relevant discrepancies
  const highestSeverity = useMemo(() => {
    if (!lote?.details?.discrepancies) return null;
    
    const relevantDiscrepancies = lote.details.discrepancies.filter((d: any) => d.isRelevant !== false);
    if (relevantDiscrepancies.length === 0) return null;
    
    const hasHigh = relevantDiscrepancies.some((d: any) => d.severity?.toLowerCase() === 'high');
    if (hasHigh) return 'high';
    
    const hasMedium = relevantDiscrepancies.some((d: any) => d.severity?.toLowerCase() === 'medium');
    if (hasMedium) return 'medium';
    
    return 'low';
  }, [lote?.details?.discrepancies]);

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

  return {
    hasRelevantDiscrepancies,
    highestSeverity,
    getSeverityStyles
  };
}
