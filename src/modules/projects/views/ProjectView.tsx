"use client"

import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { projectService } from "../services/ProjectService"
import { toggleLoteFavorite } from "@/actions/projects"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { extractTextFromPDF, extractPropertiesFromText, analyzeEditalStructure, extractLoteDetails } from "@/actions/agents"
import { validatePDFPageCount } from "@/actions/validate-pdf"
import { Loader2, Sparkles, CheckCircle2, Calendar, MapPin, Gavel, Landmark, ExternalLink, UploadCloud, FileText, X, AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
})

interface ProjectViewProps {
  projectId?: string
}

import { LoteCard } from "../components/LoteCard"
import { BankLogo } from "@/components/BankLogo"
import { Accordion } from "@/components/ui/accordion"

export function ProjectView({ projectId }: ProjectViewProps) {
  const router = useRouter()
  const [editalFile, setEditalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidatingFile, setIsValidatingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentEditalUrl, setCurrentEditalUrl] = useState<string | null>(null)
  
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStep, setAiStep] = useState<'idle' | 'extracting_text' | 'analyzing_structure' | 'extracting_details' | 'completed'>('idle')
  const [lotes, setLotes] = useState<any[]>([])
  const [globalInfo, setGlobalInfo] = useState<any>(null)
  
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualText, setManualText] = useState("")
  const [manualLoading, setManualLoading] = useState(false)
  const [pageRange, setPageRange] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        setLoading(true);
        try {
          const project = await projectService.getById(projectId)
          if (project) {
            form.reset({
              name: project.name,
              description: project.description,
            })
            if (project.editalUrl) {
                setCurrentEditalUrl(project.editalUrl);
            }
            if (project.details) {
                setGlobalInfo(project.details);
            }
            if (project.lotes && project.lotes.length > 0) {
                setLotes(project.lotes.map((l: any) => ({
                    id: l.id,
                    title: l.title,
                    description: l.description,
                    auction_prices: l.auction_prices,
                    city: l.city,
                    state: l.state,
                    type: l.details?.type,
                    rawContent: l.details?.rawContent || l.description,
                    details: l.details,
                    is_favorite: l.is_favorite
                })));
            }
          }
        } catch (error) {
            console.error("Error loading project", error);
        } finally {
            setLoading(false);
        }
      }
    };
    fetchProject();
  }, [projectId, form, router])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);
    let shouldStopLoading = true;
    try {
        const formData = new FormData();
        formData.append("name", values.name);
        if (values.description) formData.append("description", values.description);
        if (editalFile) formData.append("editalFile", editalFile);
        
        if (lotes.length > 0) {
            formData.append("lotes", JSON.stringify(lotes));
        }

        if (projectId) {
          const updated = await projectService.update(projectId, {
            name: values.name,
            description: values.description || "",
            lotes: lotes,
            details: globalInfo
          }, editalFile || undefined)
          
          if (updated) {
              window.dispatchEvent(new Event("project-update"));
              if (updated.editalUrl) setCurrentEditalUrl(updated.editalUrl);
              // Update lotes with returned data (containing real UUIDs)
              if (updated.lotes) {
                  setLotes(updated.lotes.map((l: any) => ({
                    id: l.id,
                    title: l.title,
                    description: l.description,
                    auction_prices: l.auction_prices,
                    city: l.city,
                    state: l.state,
                    type: l.details?.type,
                    rawContent: l.details?.rawContent || l.description,
                    details: l.details,
                    is_favorite: l.is_favorite
                })));
              }
          }
        } else {
            // Note: We need to use createProjectAction directly or update the service to support lotes
            // Assuming the service uses createProjectAction which we updated
            const { createProjectAction } = await import("@/actions/projects");
            const result = await createProjectAction(formData);
            if (result.success && result.data) {
                // Also update with details if available, although currently createProjectAction doesn't accept details directly in the simplified call here without updating the component logic to pass it differently or update immediately after.
                // Actually createProjectAction does accept details now via formData if we passed it.
                // Let's rely on the user to save/update after extraction for now or update create logic fully if needed.
                // But wait, we are creating a new project. If we have globalInfo here (from AI), we should pass it.
                // But the form submit happens usually before AI extraction for new projects? 
                // No, user can extract then save.
                
                // If we have globalInfo, we need to pass it to createProjectAction via formData
                // But we constructed formData above without details.
                // Let's add it.
                if (globalInfo) {
                     // We need to re-append or just append since we can't easily modify formData object here without a new one or assuming it's mutable (it is).
                     formData.append("details", JSON.stringify(globalInfo));
                }

                const { createProjectAction } = await import("@/actions/projects");
                // Re-create form data to be safe or just use the existing one
                // formData.append was done above.
                
                const result = await createProjectAction(formData);

                if (result.success && result.data) {
                    window.dispatchEvent(new Event("project-update"));
                    shouldStopLoading = false;
                    router.push(`/portal/projects/${result.data.id}`);
                }
            } else {
                throw new Error(result.error || "Failed to create project");
            }
        }
    } catch (error) {
        console.error("Error saving project", error);
        alert("Erro ao salvar o projeto. Verifique o console.");
    } finally {
        if (shouldStopLoading) {
            setLoading(false);
        }
    }
  }

  const handleDelete = async () => {
     if (loading) return;
     setLoading(true);
     try {
         if (projectId) {
            await projectService.delete(projectId);
            window.dispatchEvent(new Event("project-update"));
            router.push("/portal");
         }
     } catch (error) {
         console.error("Error deleting", error);
         alert("Erro ao excluir.");
         setLoading(false);
     }
  }

  const handleDeleteLote = (loteId: string) => {
      setLotes(prev => prev.filter(l => l.id !== loteId));
  }

  const handleToggleFavorite = async (loteId: string, currentStatus: boolean) => {
    // Optimistic update
    setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: !currentStatus } : l));
    
    try {
        const result = await toggleLoteFavorite(loteId, !currentStatus);
        if (result.success) {
            toast.success(!currentStatus ? "Adicionado aos favoritos" : "Removido dos favoritos");
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event("project-update"));
        } else {
             // Revert
             setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: currentStatus } : l));
             toast.error("Erro ao atualizar favorito");
        }
    } catch (error) {
        // Revert
        setLotes(prev => prev.map(l => l.id === loteId ? { ...l, is_favorite: currentStatus } : l));
        console.error(error);
        toast.error("Erro ao atualizar favorito");
    }
  }

  const handleFileChange = async (file: File | null) => {
    setUploadError(null);
    setEditalFile(null);
    
    if (!file) return;

    if (file.type !== 'application/pdf') {
        setUploadError("Por favor, selecione um arquivo PDF.");
        return;
    }

    setIsValidatingFile(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await validatePDFPageCount(formData);
        
        if (!result.success) {
            setUploadError(result.error || "Erro ao validar o arquivo.");
            return;
        }

        if (result.pageCount && result.pageCount > 15) {
            setUploadError(`O arquivo tem ${result.pageCount} páginas. O limite é de 15 páginas.`);
            return;
        }

        setEditalFile(file);
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
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileChange(file);
  }

  const handleAiExtraction = async () => {
    if (!editalFile) {
        setAiError("Por favor, selecione um arquivo de edital primeiro.");
        return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiStep('extracting_text');
    setLotes([]);
    setGlobalInfo(null);

    try {
        const formData = new FormData();
        formData.append('file', editalFile);
        if (pageRange.trim()) {
            formData.append('pages', pageRange.trim());
        }
        
        // Agent 1: Extract Text
        const textResult = await extractTextFromPDF(formData);
        
        if (!textResult.success || !textResult.text) {
            throw new Error(textResult.error || 'Falha ao extrair texto do PDF');
        }

        // Agent 2: Analyze Structure
        setAiStep('analyzing_structure');
        const structureResult = await analyzeEditalStructure(textResult.text);
        
        if (!structureResult.success || !structureResult.data) {
            throw new Error(structureResult.error || 'Falha ao analisar estrutura do edital');
        }

        const { globalInfo: gInfo, lotes: rawLotes } = structureResult.data;
        
        // Ensure auctionDate is an array
        if (gInfo && gInfo.auctionDate) {
            if (!Array.isArray(gInfo.auctionDate)) {
                // Try to split if it looks like a list
                if (typeof gInfo.auctionDate === 'string') {
                    if (gInfo.auctionDate.includes('\n')) {
                        gInfo.auctionDate = gInfo.auctionDate.split('\n').filter((d: string) => d.trim().length > 0);
                    } else {
                        gInfo.auctionDate = [gInfo.auctionDate];
                    }
                } else {
                    // Fallback
                    gInfo.auctionDate = [String(gInfo.auctionDate)];
                }
            }
        }

        setGlobalInfo(gInfo);
        
        // Optional: Pre-fill description with general rules
        if (gInfo?.generalRules) {
             const currentDesc = form.getValues('description');
             if (!currentDesc) form.setValue('description', gInfo.generalRules);
        }

        // Agent 3: Extract Details for each Lote
        setAiStep('extracting_details');
        
        // Process in parallel: Start all requests at once
        const lotePromises = rawLotes.map((rawLote: any) => 
            extractLoteDetails(rawLote.rawContent, gInfo)
                .then(res => {
                    if (res.success && res.data) {
                        return {
                            ...res.data,
                            id: rawLote.id, // Keep the ID from Agent 2
                            rawContent: rawLote.rawContent
                        };
                    }
                    return null;
                })
                .catch(err => {
                    console.error(`Error processing lote ${rawLote.id}:`, err);
                    return null;
                })
        );

        const results = await Promise.all(lotePromises);
        const processedLotes: any[] = results.filter(lote => lote !== null);
        
        setLotes(processedLotes);
        setAiStep('completed');
        
        // Auto-save the results
        if (projectId) {
            toast.promise(
                (async () => {
                   const values = form.getValues();
                   
                   const updated = await projectService.update(projectId, {
                       name: values.name,
                       description: values.description || "",
                       lotes: processedLotes,
                       details: gInfo
                   }, undefined); // We don't re-upload files here
                   
                   if (updated && updated.lotes) {
                       setLotes(updated.lotes.map((l: any) => ({
                            id: l.id,
                            title: l.title,
                            description: l.description,
                            auction_prices: l.auction_prices,
                            city: l.city,
                            state: l.state,
                            type: l.details?.type,
                            rawContent: l.details?.rawContent || l.description,
                            details: l.details,
                            is_favorite: l.is_favorite
                       })));
                   }
                })(),
                {
                    loading: 'Salvando resultados da análise...',
                    success: 'Análise concluída e salva com sucesso!',
                    error: 'Erro ao salvar resultados automáticos.'
                }
            );
        } else {
             toast.success("Análise concluída! Salve o projeto para persistir os dados.");
        }

    } catch (err: any) {
        setAiError(err.message || "Erro desconhecido na extração IA");
        setAiStep('idle');
    } finally {
        setAiLoading(false);
    }
  };
  
  const handleManualExtraction = async () => {
    if (!manualText.trim()) {
        toast.error("Por favor, insira o texto do lote.");
        return;
    }

    setManualLoading(true);
    try {
        const result = await extractLoteDetails(manualText, globalInfo);
        
        if (result.success && result.data) {
            const newLote = {
                ...result.data,
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(7), // Temp ID
                rawContent: manualText,
                is_favorite: false
            };
            
            // Optimistic update
            const updatedLotes = [...lotes, newLote];
            setLotes(updatedLotes);
            
            setManualDialogOpen(false);
            setManualText("");
            toast.success("Lote adicionado com sucesso!");
            
            // Auto-save if project exists
            if (projectId) {
               try {
                   const values = form.getValues();
                   const updated = await projectService.update(projectId, {
                       name: values.name,
                       description: values.description || "",
                       lotes: updatedLotes,
                       details: globalInfo
                   }, undefined); 
                   
                   if (updated && updated.lotes) {
                       setLotes(updated.lotes.map((l: any) => ({
                            id: l.id,
                            title: l.title,
                            description: l.description,
                            auction_prices: l.auction_prices,
                            city: l.city,
                            state: l.state,
                            type: l.details?.type,
                            rawContent: l.details?.rawContent || l.description,
                            details: l.details,
                            is_favorite: l.is_favorite
                       })));
                   }
               } catch (saveError) {
                   console.error("Error auto-saving manual lote", saveError);
                   toast.error("Erro ao salvar o lote no projeto.");
               }
            }
        } else {
            toast.error("Não foi possível extrair informações do texto.");
        }
    } catch (error) {
        console.error(error);
        toast.error("Erro ao processar o texto.");
    } finally {
        setManualLoading(false);
    }
  }
  
  const sortedLotes = [...lotes].sort((a, b) => {
        if (!!a.is_favorite === !!b.is_favorite) {
            return 0; 
        }
        return a.is_favorite ? -1 : 1;
    });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">{projectId ? "Editar Oportunidade" : "Nova Oportunidade"}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            {loading && projectId && !form.getValues("name") ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* Section 1: Basic Information */}
                    <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>Detalhes iniciais do projeto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* ... fields ... */}
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome da oportunidade..." {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Descrição..." {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </CardContent>
                    </Card>

                    {/* Section 2: User Inputs (Documents) */}
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    {/* ... same as before ... */}
                    <CardHeader>
                        <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            📂 Documentação
                        </CardTitle>
                        <CardDescription>
                            Faça o upload dos arquivos para análise.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormItem>
                            <FormLabel className="text-base font-semibold text-blue-900 dark:text-blue-100">
                                Edital do Leilão (PDF)
                            </FormLabel>
                            <FormDescription className="mb-4">
                                O arquivo deve ter no máximo 15 páginas para ser processado.
                            </FormDescription>
                            
                            <FormControl>
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
                                    ) : editalFile ? (
                                        <div className="flex flex-col items-center gap-2 py-2 w-full max-w-sm">
                                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                                                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="text-center w-full">
                                                <p className="text-sm font-semibold text-green-700 dark:text-green-300 truncate px-4">
                                                    {editalFile.name}
                                                </p>
                                                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                                                    {(editalFile.size / 1024 / 1024).toFixed(2)} MB • PDF pronto para envio
                                                </p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditalFile(null);
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
                                                {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo aqui'}
                                            </h3>
                                            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 text-center max-w-xs">
                                                Suportamos arquivos PDF de até 15 páginas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            
                            {uploadError && (
                                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {currentEditalUrl && !editalFile && (
                                <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Arquivo Atual</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={currentEditalUrl}>
                                                {decodeURIComponent(currentEditalUrl.split('/').pop()?.split('-').slice(1).join('-') || currentEditalUrl.split('/').pop() || 'Arquivo')}
                                            </span>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="ml-2 gap-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300">
                                        <Link href={currentEditalUrl} target="_blank">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Visualizar
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </FormItem>

                        <FormItem>
                            <FormLabel className="text-base font-semibold text-blue-900 dark:text-blue-100">
                                Páginas para Análise (Opcional)
                            </FormLabel>
                            <FormDescription>
                                Indique as páginas que deseja analisar (ex: 1-3, 5, 8-10). Deixe em branco para analisar todo o documento.
                            </FormDescription>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: 1-5, 8" 
                                    value={pageRange} 
                                    onChange={(e) => setPageRange(e.target.value)}
                                    className="mt-2"
                                    disabled={loading || aiLoading}
                                />
                            </FormControl>
                        </FormItem>
                    </CardContent>
                    </Card>

                    {/* Section 2.5: Global Info (Displayed if available) */}
                    {globalInfo && (
                        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                            <CardHeader>
                                <CardTitle className="text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                    <Gavel className="h-5 w-5" />
                                    Informações do Leilão
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {globalInfo.bankName && (
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <BankLogo bankName={globalInfo.bankName} size="md" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Banco / Comitente</p>
                                            <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.bankName}</p>
                                        </div>
                                    </div>
                                )}
                                {globalInfo.auctionDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Datas e Horários</p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {globalInfo.auctionDate.map((date: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="text-indigo-400 dark:text-indigo-500">•</span>
                                                        <span className="text-base text-indigo-700 dark:text-indigo-300">{date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {globalInfo.auctionLocation && (
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Local / Site</p>
                                            {globalInfo.auctionLocation.match(/^(https?:\/\/|www\.)|(\.com|\.br|\.net|\.org)/i) ? (
                                                <a 
                                                    href={globalInfo.auctionLocation.startsWith('http') ? globalInfo.auctionLocation : `https://${globalInfo.auctionLocation}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-base text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
                                                >
                                                    <span className="truncate">{globalInfo.auctionLocation}</span>
                                                    <ExternalLink className="h-4 w-4 shrink-0 opacity-50" />
                                                </a>
                                            ) : (
                                                <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.auctionLocation}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {globalInfo.auctioneer && (
                                    <div className="flex items-start gap-3">
                                        <Gavel className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Leiloeiro</p>
                                            <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.auctioneer}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Section 3: AI Output & Values */}
                    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-purple-800 dark:text-purple-300 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Análise de Lotes com IA
                                </CardTitle>
                                <CardDescription>
                                    Identificação automática de lotes e valores.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setManualDialogOpen(true)}
                                    disabled={loading || manualLoading}
                                    className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar Manualmente
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={handleAiExtraction}
                                    disabled={aiLoading || loading || !editalFile}
                                    className="bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 whitespace-nowrap"
                                >
                                    {aiLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {aiStep === 'extracting_text' && 'Lendo PDF...'}
                                            {aiStep === 'analyzing_structure' && 'Identificando Lotes...'}
                                            {aiStep === 'extracting_details' && 'Detalhando Lotes...'}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analisar Edital
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {aiError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800 flex items-center">
                                <span className="mr-2">⚠️</span> {aiError}
                            </div>
                        )}

                        {sortedLotes.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Lotes Identificados ({sortedLotes.length})</h3>
                                </div>
                                <Accordion type="multiple" className="w-full space-y-4">
                                    {sortedLotes.map((lote, index) => (
                                        <LoteCard 
                                            key={index} 
                                            lote={lote} 
                                            projectId={projectId || ''} 
                                            onDelete={handleDeleteLote} 
                                            onToggleFavorite={handleToggleFavorite}
                                            index={index}
                                        />
                                    ))}
                                </Accordion>
                            </div>
                        )}
                        
                    </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pt-4">
                        {/* ... existing buttons ... */}
                        {projectId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={loading}>
                                        {loading ? "Aguarde..." : "Excluir Projeto"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o projeto.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <Button type="submit" disabled={loading} className="w-32">
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
                </Form>
            )}
        </div>
      </div>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Lote Manualmente</DialogTitle>
            <DialogDescription>
              Cole o texto completo do lote aqui para que a IA possa analisar e extrair as informações.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Cole aqui a descrição do lote (ex: Lote 01 - Apartamento..."
              className="min-h-[200px]"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)} disabled={manualLoading}>
              Cancelar
            </Button>
            <Button onClick={handleManualExtraction} disabled={manualLoading}>
              {manualLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Processar com IA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
