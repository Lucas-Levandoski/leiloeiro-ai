"use client"

import { useState} from "react"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Calendar, MapPin, Gavel, ExternalLink } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
})

interface ProjectViewProps {
  projectId?: string
}

import { BankLogo } from "@/components/BankLogo"
import { DeleteProjectDialog } from "../components/DeleteProjectDialog"
import { ManualLoteDialog } from "../components/ManualLoteDialog"
import { DocumentUpload } from "../components/DocumentUpload"
import { LoteList } from "../components/LoteList"
import { BasicInfoForm } from "../components/BasicInfoForm"
import { useProjectLotes } from "../hooks/useProjectLotes"
import { useEditalAnalysis } from "../hooks/useEditalAnalysis"
import { useProjectForm } from "../hooks/useProjectForm"
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
                    <LoteList
                        lotes={lotes}
                        projectId={projectId}
                        onDeleteLote={handleDeleteLote}
                        onToggleFavorite={handleToggleFavorite}
                        onManualAdd={() => setManualDialogOpen(true)}
                        onAiExtraction={handleAiExtraction}
                        loading={loading}
                        manualLoading={manualLoading}
                        aiLoading={aiLoading}
                        aiError={aiError}
                        aiStep={aiStep}
                        editalFile={editalFile}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        {/* ... existing buttons ... */}
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
