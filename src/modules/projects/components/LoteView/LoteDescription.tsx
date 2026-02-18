
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, FileText, Loader2, Save, X } from "lucide-react";

interface LoteDescriptionProps {
    lote: any;
    isEditingDescription: boolean;
    setIsEditingDescription: (value: boolean) => void;
    descriptionValue: string;
    setDescriptionValue: (value: string) => void;
    isSavingDescription: boolean;
    handleSaveDescription: () => void;
}

export function LoteDescription({
    lote,
    isEditingDescription,
    setIsEditingDescription,
    descriptionValue,
    setDescriptionValue,
    isSavingDescription,
    handleSaveDescription
}: LoteDescriptionProps) {
    return (
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
    );
}
