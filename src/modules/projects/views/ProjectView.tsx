"use client"

import { useState} from "react"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
})

interface ProjectViewProps {
  projectId?: string
}

import { DeleteProjectDialog } from "../components/DeleteProjectDialog"
import { ManualLoteDialog } from "../components/ManualLoteDialog"
import { DocumentUpload } from "../components/DocumentUpload"
import { LoteList } from "../components/LoteList"
import { BasicInfoForm } from "../components/BasicInfoForm"
import { useProjectLotes } from "../hooks/useProjectLotes"
import { useEditalAnalysis } from "../hooks/useEditalAnalysis"
import { useProjectForm } from "../hooks/useProjectForm"
import { GlobalInfoCard } from "../components/GlobalInfoCard"
import Link from "next/link"

export function ProjectView({ projectId }: ProjectViewProps) {
  const [editalFile, setEditalFile] = useState<File | null>(null)
  const [currentEditalUrl, setCurrentEditalUrl] = useState<string | null>(null)
  const [pageRange, setPageRange] = useState("")
  const [pageCount, setPageCount] = useState(0)

  const {
    lotes,
    setLotes,
    globalInfo,
    setGlobalInfo,
    manualDialogOpen,
    setManualDialogOpen,
    manualLoading,
    handleDeleteLote,
    handleToggleFavorite,
    handleManualExtraction
  } = useProjectLotes(projectId)

  const {
    form,
    loading,
    notFound,
    onSubmit,
    handleDelete
  } = useProjectForm({
    projectId,
    setLotes,
    setGlobalInfo,
    setCurrentEditalUrl
  })

  const {
    aiLoading,
    aiError,
    aiStep,
    handleAiExtraction
  } = useEditalAnalysis({
    projectId,
    editalFile,
    pageRange,
    pageCount,
    setLotes,
    setGlobalInfo,
    formValues: form.getValues(),
    setFormDescription: (desc) => form.setValue('description', desc)
  })

  const handleFormSubmit = form.handleSubmit((values) => onSubmit(values, editalFile, lotes, globalInfo))

  const handleUpdateLote = (loteId: string, newData: any) => {
    setLotes(prev => prev.map(l => l.id === loteId ? { ...l, ...newData } : l))
  }

  if (notFound) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-none p-6 pb-0">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Oportunidade não encontrada</h1>
                </div>
            </div>
             <div className="flex-1 p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <p className="text-muted-foreground">O projeto que você está tentando acessar não existe ou foi removido.</p>
                    <Button asChild>
                        <Link href="/portal">Voltar para o Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
  }

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
                <form onSubmit={handleFormSubmit} className="space-y-8">
                    
                    {/* Section 1: Basic Information */}
                    <BasicInfoForm control={form.control} loading={loading} />

                    {/* Section 2: User Inputs (Documents) */}
                    <DocumentUpload
                        editalFile={editalFile}
                        onFileChange={setEditalFile}
                        currentEditalUrl={currentEditalUrl}
                        pageRange={pageRange}
                        onPageRangeChange={setPageRange}
                        onPageCountChange={setPageCount}
                        loading={loading}
                        aiLoading={aiLoading}
                    />

                    {/* Section 2.5: Global Info (Displayed if available) */}
                    {globalInfo && (
                        <GlobalInfoCard 
                            globalInfo={globalInfo} 
                            onUpdate={setGlobalInfo} 
                        />
                    )}

                    {/* Section 3: AI Output & Values */}
                    <LoteList
                        lotes={lotes}
                        projectId={projectId}
                        onDeleteLote={handleDeleteLote}
                        onToggleFavorite={handleToggleFavorite}
                        onManualAdd={() => setManualDialogOpen(true)}
                        onAiExtraction={handleAiExtraction}
                        onUpdateLote={handleUpdateLote}
                        loading={loading}
                        manualLoading={manualLoading}
                        aiLoading={aiLoading}
                        aiError={aiError}
                        aiStep={aiStep}
                        editalFile={editalFile}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        {projectId && (
                            <DeleteProjectDialog loading={loading} onDelete={handleDelete} />
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

      <ManualLoteDialog 
        open={manualDialogOpen} 
        onOpenChange={setManualDialogOpen} 
        onProcess={handleManualExtraction} 
        loading={manualLoading} 
      />
    </div>
  )
}
