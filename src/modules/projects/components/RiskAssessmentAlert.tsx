import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RiskAssessmentAlertProps {
    details?: {
        risk_level?: string;
        is_risky?: boolean;
        risk_analysis?: string;
        [key: string]: any;
    };
}

export function RiskAssessmentAlert({ details }: RiskAssessmentAlertProps) {
    if (!details || (!details.risk_level && !details.is_risky && !details.risk_analysis)) {
        return null;
    }

    return (
        <Alert 
            variant={
                details.risk_level === "high" || details.is_risky === true ? "destructive" : 
                details.risk_level === "medium" ? "default" : 
                "default"
            } 
            className={
                details.risk_level === "high" || details.is_risky === true ? "border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200" :
                details.risk_level === "medium" ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200" :
                details.risk_level === "low" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200" :
                "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }
        >
            <AlertTriangle className={
                details.risk_level === "high" || details.is_risky === true ? "text-red-900 dark:text-red-200" :
                details.risk_level === "medium" ? "text-yellow-900 dark:text-yellow-200" :
                details.risk_level === "low" ? "text-green-900 dark:text-green-200" :
                "text-gray-900 dark:text-gray-200"
            } />
            <AlertTitle className="flex items-center gap-2">
                Análise de Risco
                {details.risk_level && (
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                        details.risk_level === "high" ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100" :
                        details.risk_level === "medium" ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                        "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100"
                    }`}>
                        {details.risk_level === "high" ? "Alto Risco" : 
                         details.risk_level === "medium" ? "Médio Risco" : 
                         "Baixo Risco"}
                    </span>
                )}
            </AlertTitle>
            <AlertDescription className="mt-2">
                {details.risk_analysis || "Este lote apresenta características que podem indicar riscos. Verifique as informações detalhadamente."}
            </AlertDescription>
        </Alert>
    );
}
