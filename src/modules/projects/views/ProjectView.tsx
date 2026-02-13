"use client"

import { useEffect, useState } from "react"
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
import { Loader2, Sparkles, CheckCircle2, Calendar, MapPin, Gavel, Landmark } from "lucide-react"
import { toast } from "sonner"
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

export function ProjectView({ projectId }: ProjectViewProps) {
  const router = useRouter()
  const [editalFile, setEditalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentEditalUrl, setCurrentEditalUrl] = useState<string | null>(null)
  
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStep, setAiStep] = useState<'idle' | 'extracting_text' | 'analyzing_structure' | 'extracting_details' | 'completed'>('idle')
  const [lotes, setLotes] = useState<any[]>([])
  const [globalInfo, setGlobalInfo] = useState<any>(null)
  
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
    setLoading(true);
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
        setLoading(false);
    }
  }

  const handleDelete = async () => {
     setLoading(true);
     try {
         if (projectId) {
            await projectService.delete(projectId);
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
                            <FormLabel>Edital do Leilão (PDF)</FormLabel>
                            <div className="flex gap-4 items-end">
                                <FormControl className="flex-1">
                                    <Input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={(e) => setEditalFile(e.target.files?.[0] || null)} 
                                        disabled={loading}
                                        className="bg-white dark:bg-background/50" 
                                    />
                                </FormControl>
                            </div>
                            {currentEditalUrl && (
                                <FormDescription className="flex items-center gap-2 mt-2">
                                    Arquivo atual: 
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {decodeURIComponent(currentEditalUrl.split('/').pop()?.split('-').slice(1).join('-') || currentEditalUrl.split('/').pop() || 'Arquivo')}
                                    </span>
                                    <Button asChild variant="link" className="p-0 h-auto">
                                        <Link href={currentEditalUrl} target="_blank">Visualizar</Link>
                                    </Button>
                                </FormDescription>
                            )}
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
                                        <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
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
                                            <p className="text-base text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">{globalInfo.auctionDate}</p>
                                        </div>
                                    </div>
                                )}
                                {globalInfo.auctionLocation && (
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Local / Site</p>
                                            <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.auctionLocation}</p>
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
                                <div className="grid grid-cols-1 gap-4">
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
                                </div>
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
    </div>
  )
}
