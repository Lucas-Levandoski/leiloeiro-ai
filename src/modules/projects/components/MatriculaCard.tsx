import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, FileText as FileTextIcon, Upload, ExternalLink, AlertCircle, Check, Sparkles } from "lucide-react";

interface MatriculaCardProps {
  lote: any;
  file: File | null;
  setFile: (file: File | null) => void;
  loading: boolean;
  onProcess: () => void;
  onRemove: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export function MatriculaCard({ 
  lote, 
  file, 
  setFile, 
  loading, 
  onProcess, 
  onRemove, 
  isExpanded, 
  setIsExpanded 
}: MatriculaCardProps) {
    return (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200">
                    <FileTextIcon className="h-5 w-5" /> 
                    Análise da Matrícula
                    <span className="flex items-center gap-1 text-xs font-normal bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 ml-2">
                        <Sparkles className="h-3 w-3" /> IA
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!lote.details?.matricula_data ? (
                    <div className="bg-white/80 dark:bg-muted/50 p-6 rounded-lg border border-dashed border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-sm">
                            <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-medium text-blue-900 dark:text-blue-200">Upload da Matrícula (PDF)</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Envie o PDF da matrícula para análise automática de ônus e restrições.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full max-w-sm">
                            <Input 
                                type="file" 
                                accept=".pdf" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="cursor-pointer bg-white dark:bg-background border-blue-200 dark:border-blue-800"
                            />
                            <Button 
                                onClick={onProcess} 
                                disabled={!file || loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Analisar com IA
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-background rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-blue-50/50 dark:bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-900 dark:text-blue-200">Resultado da Análise</span>
                                {lote.details.matricula_url && (
                                    <a href={lote.details.matricula_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                        (Ver PDF <ExternalLink className="h-3 w-3" />)
                                    </a>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? "Recolher" : "Expandir"}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onRemove}>
                                    Remover
                                </Button>
                            </div>
                        </div>
                        
                        {(isExpanded || true) && (
                            <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 ${!isExpanded ? 'hidden' : ''}`}>
                                {/* Booleans */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Restrições e Ônus</h4>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'penhora_judicial', label: 'Penhora Judicial' },
                                            { key: 'arresto', label: 'Arresto' },
                                            { key: 'usufruto', label: 'Usufruto' },
                                            { key: 'clausulas_restritivas', label: 'Cláusulas Restritivas' },
                                            { key: 'indisponibilidade', label: 'Indisponibilidade' },
                                            { key: 'procedimento_extrajudicial', label: 'Procedimento Extrajudicial' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-muted/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-colors">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                {lote.details.matricula_data[item.key] ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                                                        <AlertCircle className="h-3 w-3" /> Detectado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                                        <Check className="h-3 w-3" /> Não Consta
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informações Detalhadas</h4>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'alienacao_fiduciaria', label: 'Alienação Fiduciária' },
                                            { key: 'contrato', label: 'Contrato' },
                                            { key: 'credor', label: 'Banco/Credor' },
                                            { key: 'cpf_devedores', label: 'CPF Devedores' },
                                            { key: 'proprietario_atual', label: 'Proprietário Atual' },
                                            { key: 'data_primeiro_leilao', label: '1º Leilão' },
                                            { key: 'data_segundo_leilao', label: '2º Leilão' },
                                            { key: 'numero_matricula', label: 'Matrícula' },
                                            { key: 'area_total', label: 'Área Total' },
                                            { key: 'area_privativa', label: 'Área Privativa' },
                                            { key: 'area_terreno', label: 'Área Terreno' },
                                        ].map((item) => (
                                            <div key={item.key} className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                                                <div className="text-sm p-2 bg-gray-50 dark:bg-muted/30 rounded border min-h-[38px] flex items-center break-all">
                                                    {lote.details.matricula_data[item.key] || <span className="text-muted-foreground/50 italic">Não identificado</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
