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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
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
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)

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
            if (project.fileUrl) {
                setCurrentFileUrl(project.fileUrl);
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
          }, file || undefined)
          
          if (updated?.fileUrl) {
              setCurrentFileUrl(updated.fileUrl);
          }
          // Optional: clear file input
        } else {
          const newProject = await projectService.create({
            name: values.name,
            description: values.description || "",
          }, file || undefined)
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
            <CardTitle>{projectId ? "Editar Oportunidade" : "Nova Oportunidade"}</CardTitle>
        </CardHeader>
        <CardContent>
            {loading && projectId && !form.getValues("name") ? (
                <div>Carregando...</div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    
                    <FormItem>
                        <FormLabel>Arquivo</FormLabel>
                        <FormControl>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={loading} />
                        </FormControl>
                        {currentFileUrl && (
                            <FormDescription className="flex items-center gap-2">
                                Arquivo atual: 
                                <Button asChild variant="link" className="p-0 h-auto">
                                    <Link href={currentFileUrl} target="_blank">Visualizar</Link>
                                </Button>
                            </FormDescription>
                        )}
                        <FormDescription>
                            Carregue um arquivo para anexar ao projeto.
                        </FormDescription>
                    </FormItem>

                    <div className="flex justify-between">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                        {projectId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={loading}>
                                        {loading ? "Aguarde..." : "Excluir"}
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
                    </div>
                </form>
                </Form>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
