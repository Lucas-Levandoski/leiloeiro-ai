    import { Button } from "@/components/ui/button"
import { Eye, Trash2, Building2, FileText, Star, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

interface LoteCardProps {
    lote: any;
    projectId: string;
    onDelete: (id: string) => void;
    onToggleFavorite?: (id: string, currentStatus: boolean) => void;
    index: number;
}

export function LoteCard({ lote, projectId, onDelete, onToggleFavorite, index }: LoteCardProps) {
    return (
        <AccordionItem value={lote.id || String(index)} className="bg-card rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden mb-0">
            <div className="absolute top-3 right-12 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') && onToggleFavorite && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(lote.id, !!lote.is_favorite);
                        }}
                    >
                        <Star className={`h-4 w-4 ${lote.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                )}
                {lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') && (
                    <Link href={`/portal/projects/${projectId}/lotes/${lote.id}`} passHref onClick={(e) => e.stopPropagation()}>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                )}
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(lote.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 pr-24 text-left w-full">
                    {lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') ? (
                        <span 
                            className="flex items-center gap-2 font-semibold text-foreground hover:underline z-50 group/link cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/portal/projects/${projectId}/lotes/${lote.id}`, '_blank');
                            }}
                        >
                            <h4 className="line-clamp-1" title={lote.title}>{lote.title}</h4>
                            <ExternalLink className="h-4 w-4 shrink-0 opacity-50 group-hover/link:opacity-100" />
                        </span>
                    ) : (
                        <h4 className="font-semibold text-foreground line-clamp-1" title={lote.title}>{lote.title}</h4>
                    )}
                </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4 pb-4">
                <div className="flex justify-between items-center mb-2 pt-2">
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
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                    {lote.description || lote.rawContent}
                </p>
            </AccordionContent>
        </AccordionItem>
    )
}
