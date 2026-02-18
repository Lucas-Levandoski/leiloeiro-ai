import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { projectService } from "../services/ProjectService"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof formSchema>

interface UseProjectFormProps {
  projectId?: string
  setLotes: (lotes: any[]) => void
  setGlobalInfo: (info: any) => void
  setCurrentEditalUrl: (url: string | null) => void
}

export function useProjectForm({
  projectId,
  setLotes,
  setGlobalInfo,
  setCurrentEditalUrl
}: UseProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        setLoading(true)
        try {
          const project = await projectService.getById(projectId)
          if (project) {
            form.reset({
              name: project.name,
              description: project.description,
            })
            if (project.editalUrl) {
                setCurrentEditalUrl(project.editalUrl)
            }
            if (project.details) {
                setGlobalInfo(project.details)
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
                })))
            }
          }
        } catch (error) {
            console.error("Error loading project", error)
        } finally {
            setLoading(false)
        }
      }
    }
    fetchProject()
  }, [projectId, form, router, setCurrentEditalUrl, setGlobalInfo, setLotes])

  const onSubmit = async (
    values: ProjectFormValues, 
    editalFile: File | null, 
    lotes: any[], 
    globalInfo: any
  ) => {
    if (loading) return
    setLoading(true)
    let shouldStopLoading = true
    try {
        const formData = new FormData()
        formData.append("name", values.name)
        if (values.description) formData.append("description", values.description)
        if (editalFile) formData.append("editalFile", editalFile)
        
        if (lotes.length > 0) {
            formData.append("lotes", JSON.stringify(lotes))
        }

        if (projectId) {
          const updated = await projectService.update(projectId, {
            name: values.name,
            description: values.description || "",
            lotes: lotes,
            details: globalInfo
          }, editalFile || undefined)
          
          if (updated) {
              window.dispatchEvent(new Event("project-update"))
              if (updated.editalUrl) setCurrentEditalUrl(updated.editalUrl)
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
                })))
              }
          }
        } else {
            // Note: We need to use createProjectAction directly or update the service to support lotes
            // Assuming the service uses createProjectAction which we updated
            const { createProjectAction } = await import("@/actions/projects")
            
            const result = await createProjectAction(formData)

            if (result.success && result.data) {
                window.dispatchEvent(new Event("project-update"))
                shouldStopLoading = false
                router.push(`/portal/projects/${result.data.id}`)
            } else {
                throw new Error(result.error || "Failed to create project")
            }
        }
    } catch (error) {
        console.error("Error saving project", error)
        alert("Erro ao salvar o projeto. Verifique o console.")
    } finally {
        if (shouldStopLoading) {
            setLoading(false)
        }
    }
  }

  const handleDelete = async () => {
     if (loading) return
     setLoading(true)
     try {
         if (projectId) {
            await projectService.delete(projectId)
            window.dispatchEvent(new Event("project-update"))
            router.push("/portal")
         }
     } catch (error) {
         console.error("Error deleting", error)
         alert("Erro ao excluir.")
         setLoading(false)
     }
  }

  return {
    form,
    loading,
    notFound,
    onSubmit,
    handleDelete
  }
}
