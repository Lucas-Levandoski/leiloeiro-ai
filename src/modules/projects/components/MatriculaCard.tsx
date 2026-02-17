"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, FileText as FileTextIcon, Upload, ExternalLink, AlertCircle, Check, Sparkles, UploadCloud, X } from "lucide-react";
import { validatePDFPageCount } from "@/actions/validate-pdf";

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
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isValidatingFile, setIsValidatingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (selectedFile: File | null) => {
        setUploadError(null);
        setFile(null);
        
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            setUploadError("Por favor, selecione um arquivo PDF.");
            return;
        }

        setIsValidatingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const result = await validatePDFPageCount(formData);
            
            if (!result.success) {
                setUploadError(result.error || "Erro ao validar o arquivo.");
                return;
            }

            if (result.pageCount && result.pageCount > 15) {
                setUploadError(`O arquivo tem ${result.pageCount} páginas. O limite é de 15 páginas.`);
                return;
            }

            setFile(selectedFile);
        } catch (error) {
            console.error("Error validating file", error);
            setUploadError("Erro ao validar o arquivo.");
        } finally {
            setIsValidatingFile(false);
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) handleFileChange(droppedFile);
    }

    const formatMatriculaValue = (key: string, value: string | null) => {
        if (!value) return <span className="text-muted-foreground/50 italic">Não identificado</span>;

        if (key.startsWith('area_')) {
            // Tenta encontrar um número no valor (suporta formatos BR e US)
            // Ex: 100, 100.50, 100,50, 1.200,50
            return value.replace(/([\d\.,]+)/, (match) => {
                let clean = match;
                
                // Se tem vírgula e ponto, assume formato BR (1.234,56)
                if (clean.includes(',') && clean.includes('.')) {
                    clean = clean.replace(/\./g, '').replace(',', '.');
                } else if (clean.includes(',')) {
                    // Se só tem vírgula, assume decimal (123,45)
                    clean = clean.replace(',', '.');
                }
                // Se só tem ponto, deixa como está (123.45) ou (1.234)
                // Assumindo que o LLM retorna floats com ponto ou BR com vírgula
                
                const num = parseFloat(clean);
                if (isNaN(num)) return match;
                
                return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            });
        }
        
        return value;
    };

    return (
        !lote.details?.matricula_data ? (
            <div className="space-y-4">
                <div 
                    className={`
                        relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer
                        flex flex-col items-center justify-center gap-4
                        ${isDragging 
                            ? 'border-blue-500 bg-blue-100/50 dark:bg-blue-900/30 scale-[1.02]' 
                            : 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white/50 dark:bg-background/50'
                        }
                        ${uploadError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                    `}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        disabled={loading || isValidatingFile}
                    />
                    
                    {isValidatingFile ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Validando arquivo...</p>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-2 py-2 w-full max-w-sm">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                                <FileTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-center w-full">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-300 truncate px-4">
                                    {file.name}
                                </p>
                                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • PDF pronto para envio
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    setUploadError(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                <X className="h-4 w-4 mr-1" /> Remover arquivo
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                            <div className={`
                                h-16 w-16 rounded-full flex items-center justify-center mb-2 transition-colors
                                ${isDragging ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900/30'}
                            `}>
                                <UploadCloud className={`
                                    h-8 w-8 transition-colors
                                    ${isDragging ? 'text-blue-700 dark:text-blue-200' : 'text-blue-500 dark:text-blue-400'}
                                `} />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                {isDragging ? 'Solte a matrícula aqui' : 'Clique ou arraste a matrícula aqui'}
                            </h3>
                            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 text-center max-w-xs">
                                Suportamos arquivos PDF de até 15 páginas.
                            </p>
                        </div>
                    )}
                </div>
                
                {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                )}

                <div className="flex justify-center pt-2">
                    <Button 
                        onClick={onProcess} 
                        disabled={!file || loading || isValidatingFile}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full sm:w-auto min-w-[200px]"
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
            <div className="bg-transparent">
                <div className="p-4 border-b bg-blue-50/50 dark:bg-muted/30 flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-900 dark:text-blue-200">Resultado da Análise</span>
                        {lote.details.matricula_url && (
                            <a href={lote.details.matricula_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                (Ver PDF <ExternalLink className="h-3 w-3" />)
                            </a>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onRemove}>
                            Remover
                        </Button>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                                            {formatMatriculaValue(item.key, lote.details.matricula_data[item.key])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
    );
}
