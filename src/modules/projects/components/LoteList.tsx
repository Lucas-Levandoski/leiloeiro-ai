import { Accordion } from "@/components/ui/accordion"
import { LoteCard } from "./LoteCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Plus } from "lucide-react"

interface LoteListProps {
  lotes: any[]
  projectId?: string
  onDeleteLote: (loteId: string) => void
  onToggleFavorite: (loteId: string, currentStatus: boolean) => void
  onManualAdd: () => void
  onAiExtraction: () => void
  loading: boolean
  manualLoading: boolean
  aiLoading: boolean
  aiError: string | null
  aiStep: 'idle' | 'extracting_text' | 'analyzing_structure' | 'extracting_details' | 'completed'
  editalFile: File | null
}

export function LoteList({
  lotes,
  projectId,
  onDeleteLote,
  onToggleFavorite,
  onManualAdd,
  onAiExtraction,
  loading,
  manualLoading,
  aiLoading,
  aiError,
  aiStep,
  editalFile
}: LoteListProps) {
  
  const sortedLotes = [...lotes].sort((a, b) => {
    if (!!a.is_favorite === !!b.is_favorite) {
        return 0; 
    }
    return a.is_favorite ? -1 : 1;
  });

  return (
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
                    onClick={onManualAdd}
                    disabled={loading || manualLoading}
                    className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Manualmente
                </Button>
                <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={onAiExtraction}
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
                        <div key={index} className="mb-4 last:mb-0">
                            <LoteCard 
                                lote={lote} 
                                projectId={projectId || ''} 
                                onDelete={onDeleteLote} 
                                onToggleFavorite={onToggleFavorite}
                                index={index}
                            />
                        </div>
                    ))}
                </Accordion>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
