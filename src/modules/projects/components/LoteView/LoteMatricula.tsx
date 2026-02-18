
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MatriculaCard } from "@/modules/projects/components/MatriculaCard";
import { Check, FileText } from "lucide-react";

interface LoteMatriculaProps {
    lote: any;
    matriculaFile: File | null;
    setMatriculaFile: (file: File | null) => void;
    matriculaLoading: boolean;
    handleMatriculaProcess: () => void;
    handleRemoveMatricula: () => void;
    setIsMatriculaExpanded: (value: boolean) => void;
}

export function LoteMatricula({
    lote,
    matriculaFile,
    setMatriculaFile,
    matriculaLoading,
    handleMatriculaProcess,
    handleRemoveMatricula,
    setIsMatriculaExpanded
}: LoteMatriculaProps) {
    return (
        <AccordionItem value="matricula" className="border rounded-lg bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                    <FileText className="h-5 w-5" />
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
    );
}
