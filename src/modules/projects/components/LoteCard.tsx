import { Button } from "@/components/ui/button"
import { Eye, Trash2, Building2, FileText, Star } from "lucide-react"
import Link from "next/link"

interface LoteCardProps {
    lote: any;
    projectId: string;
    onDelete: (id: string) => void;
    onToggleFavorite?: (id: string, currentStatus: boolean) => void;
    index: number;
}

export function LoteCard({ lote, projectId, onDelete, onToggleFavorite, index }: LoteCardProps) {
    return (
        <div className="bg-card p-4 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') && onToggleFavorite && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
                        onClick={() => onToggleFavorite(lote.id, !!lote.is_favorite)}
                    >
                        <Star className={`h-4 w-4 ${lote.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                )}
                {lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') && (
                    <Link href={`/portal/projects/${projectId}/lotes/${lote.id}`} passHref>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                )}
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => onDelete(lote.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex justify-between items-start mb-2 pr-24">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground line-clamp-1" title={lote.title}>{lote.title}</h4>
                </div>
            </div>
            <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col gap-1">
                     {lote.auction_prices && lote.auction_prices.length > 0 ? (
                         lote.auction_prices.map((price: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">{price.label}:</span>
                                <span className="text-green-600 dark:text-green-400 font-bold">{price.value}</span>
                            </div>
                         ))
                     ) : (
                         <span className="text-muted-foreground text-sm">Preços não informados</span>
                     )}
                </div>
            </div>
            <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-gray-500" />
                    <span>{lote.type || 'Tipo não identificado'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-gray-500" />
                    <span className="truncate">{lote.city || 'Cidade n/d'} - {lote.state || 'UF'}</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {lote.description || lote.rawContent}
            </p>
        </div>
    )
}
