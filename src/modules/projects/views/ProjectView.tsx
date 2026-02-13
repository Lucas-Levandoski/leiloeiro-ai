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
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { extractTextFromPDF, extractPropertiesFromText } from "@/actions/agents"
import { Loader2, Sparkles } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
  price: z.string().optional(),
  estimatedPrice: z.string().optional(),
})

interface ProjectViewProps {
  projectId?: string
}

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

export function ProjectView({ projectId }: ProjectViewProps) {
  const router = useRouter()
  const [editalFile, setEditalFile] = useState<File | null>(null)
  const [municipalFile, setMunicipalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentEditalUrl, setCurrentEditalUrl] = useState<string | null>(null)
  const [currentMunicipalUrl, setCurrentMunicipalUrl] = useState<string | null>(null)
  
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      estimatedPrice: "",
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
              price: project.price || "",
              estimatedPrice: project.estimatedPrice || "",
            })
            if (project.editalUrl) {
                setCurrentEditalUrl(project.editalUrl);
            }
            if (project.municipalUrl) {
                setCurrentMunicipalUrl(project.municipalUrl);
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
        if (projectId) {
          const updated = await projectService.update(projectId, {
            name: values.name,
            description: values.description || "",
            price: values.price,
            estimatedPrice: values.estimatedPrice,
          }, editalFile || undefined, municipalFile || undefined)
          
          if (updated?.editalUrl) {
              setCurrentEditalUrl(updated.editalUrl);
          }
          if (updated?.municipalUrl) {
              setCurrentMunicipalUrl(updated.municipalUrl);
          }
        } else {
          const newProject = await projectService.create({
            name: values.name,
            description: values.description || "",
            price: values.price,
            estimatedPrice: values.estimatedPrice,
          }, editalFile || undefined, municipalFile || undefined)
          router.push(`/portal/projects/${newProject.id}`)
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

  const handleAiExtraction = async () => {
    if (!editalFile) {
        setAiError("Por favor, selecione um arquivo de edital primeiro.");
        return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
        const formData = new FormData();
        formData.append('file', editalFile);
        
        const textResult = await extractTextFromPDF(formData);
        
        if (!textResult.success || !textResult.text) {
            throw new Error(textResult.error || 'Falha ao extrair texto do PDF');
        }

        const propsResult = await extractPropertiesFromText(textResult.text);
        
        if (!propsResult.success || !propsResult.data) {
            throw new Error(propsResult.error || 'Falha ao analisar propriedades');
        }

        const { price, estimatedPrice } = propsResult.data;
        
        if (price) form.setValue('price', String(price));
        if (estimatedPrice) form.setValue('estimatedPrice', String(estimatedPrice));

    } catch (err: any) {
        setAiError(err.message || "Erro desconhecido na extração IA");
    } finally {
        setAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{projectId ? "Editar Oportunidade" : "Nova Oportunidade"}</h1>
      </div>

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
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    📂 Documentação (Input)
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
                                className="bg-white" 
                            />
                        </FormControl>
                    </div>
                    {currentEditalUrl && (
                        <FormDescription className="flex items-center gap-2 mt-2">
                            Arquivo atual: 
                            <Button asChild variant="link" className="p-0 h-auto">
                                <Link href={currentEditalUrl} target="_blank">Visualizar</Link>
                            </Button>
                        </FormDescription>
                    )}
                    <FormDescription>
                        Este arquivo será usado pela IA para extrair informações.
                    </FormDescription>
                </FormItem>

                <FormItem>
                    <FormLabel>Inscrição Municipal</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            onChange={(e) => setMunicipalFile(e.target.files?.[0] || null)} 
                            disabled={loading}
                            className="bg-white"
                        />
                    </FormControl>
                    {currentMunicipalUrl && (
                        <FormDescription className="flex items-center gap-2 mt-2">
                            Arquivo atual: 
                            <Button asChild variant="link" className="p-0 h-auto">
                                <Link href={currentMunicipalUrl} target="_blank">Visualizar</Link>
                            </Button>
                        </FormDescription>
                    )}
                </FormItem>
              </CardContent>
            </Card>

            {/* Section 3: AI Output & Values */}
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-purple-800 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            Análise da IA (Output)
                        </CardTitle>
                        <CardDescription>
                            Valores extraídos e análise financeira.
                        </CardDescription>
                    </div>
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={handleAiExtraction}
                        disabled={aiLoading || loading || !editalFile}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200"
                    >
                        {aiLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Extrair Dados
                            </>
                        )}
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {aiError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {aiError}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor do Bem (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 100.000,00" {...field} disabled={loading} className="bg-white font-medium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estimatedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Estimado de Mercado (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 120.000,00" {...field} disabled={loading} className="bg-white font-medium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
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
  )
}
