import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FormItem, FormLabel, FormDescription, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, UploadCloud, FileText, X, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { validatePDFPageCount } from "@/actions/validate-pdf"
import { toast } from "sonner"

interface DocumentUploadProps {
  editalFile: File | null
  onFileChange: (file: File | null) => void
  currentEditalUrl: string | null
  pageRange: string
  onPageRangeChange: (range: string) => void
  onPageCountChange: (count: number) => void
  loading: boolean
  aiLoading: boolean
}

export function DocumentUpload({
  editalFile,
  onFileChange,
  currentEditalUrl,
  pageRange,
  onPageRangeChange,
  onPageCountChange,
  loading,
  aiLoading
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isValidatingFile, setIsValidatingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File | null) => {
    setUploadError(null)
    onFileChange(null)
    
    if (!file) return

    if (file.type !== 'application/pdf') {
        setUploadError("Por favor, selecione um arquivo PDF.")
        return
    }

    setIsValidatingFile(true)
    try {
        const formData = new FormData()
        formData.append('file', file)
        
        const result = await validatePDFPageCount(formData)
        
        if (!result.success) {
            setUploadError(result.error || "Erro ao validar o arquivo.")
            return
        }

        onPageCountChange(result.pageCount || 0)

        if (result.pageCount && result.pageCount > 15) {
            toast.warning(`O arquivo tem ${result.pageCount} páginas. Você precisará selecionar as páginas para análise (máx. 15).`)
        }

        onFileChange(file)
    } catch (error) {
        console.error("Error validating file", error)
        setUploadError("Erro ao validar o arquivo.")
    } finally {
        setIsValidatingFile(false)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileChange(file)
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
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
                Selecione até 15 páginas para análise (mesmo em arquivos maiores).
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
                                    e.stopPropagation()
                                    onFileChange(null)
                                    setUploadError(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
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
                                Selecione até 15 páginas para análise.
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
                    onChange={(e) => onPageRangeChange(e.target.value)}
                    className="mt-2"
                    disabled={loading || aiLoading}
                />
            </FormControl>
        </FormItem>
      </CardContent>
    </Card>
  )
}
