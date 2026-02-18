
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Trash2, Building2, FileText, Star, ExternalLink, Pencil, Save, X, Plus } from "lucide-react"
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
    onUpdate?: (id: string, newData: any) => void;
    index: number;
}

export function LoteCard({ lote, projectId, onDelete, onToggleFavorite, onUpdate, index }: LoteCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState(lote)

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFormData(lote)
        setIsEditing(true)
    }

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFormData(lote)
        setIsEditing(false)
    }

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onUpdate) {
            onUpdate(lote.id, formData)
        }
        setIsEditing(false)
    }

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handlePriceChange = (index: number, field: 'label' | 'value', value: string) => {
        const newPrices = [...(formData.auction_prices || [])]
        if (!newPrices[index]) newPrices[index] = { label: '', value: '' }
        newPrices[index] = { ...newPrices[index], [field]: value }
        setFormData((prev: any) => ({ ...prev, auction_prices: newPrices }))
    }

    const addPrice = () => {
        setFormData((prev: any) => ({
            ...prev,
            auction_prices: [...(prev.auction_prices || []), { label: 'Valor', value: '' }]
        }))
    }

    const removePrice = (index: number) => {
        const newPrices = [...(formData.auction_prices || [])]
        newPrices.splice(index, 1)
        setFormData((prev: any) => ({ ...prev, auction_prices: newPrices }))
    }

    return (
        <AccordionItem value={lote.id || String(index)} className="bg-card rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden mb-0">
            <div className="absolute top-3 right-12 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isEditing ? (
                    <>
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
                        {onUpdate && (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                                onClick={handleEdit}
                            >
                                <Pencil className="h-4 w-4" />
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
                    </>
                ) : (
                    <div className="flex gap-2 bg-white/80 dark:bg-black/80 rounded p-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={handleSave}
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={handleCancel}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 pr-24 text-left w-full">
                    {isEditing ? (
                        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                            <Input 
                                value={formData.title} 
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="h-8 font-semibold"
                                placeholder="Título do Lote"
                            />
                        </div>
                    ) : (
                        lote.id && lote.id !== 'undefined' && !lote.id.toString().startsWith('new-') ? (
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
                        )
                    )}
                </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4 pb-4">
                <div className="mb-2 pt-2">
                    {isEditing ? (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Preços</label>
                            {(formData.auction_prices || []).map((price: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input 
                                        value={price.label} 
                                        onChange={(e) => handlePriceChange(idx, 'label', e.target.value)}
                                        className="h-7 text-xs w-1/3"
                                        placeholder="Rótulo"
                                    />
                                    <Input 
                                        value={price.value} 
                                        onChange={(e) => handlePriceChange(idx, 'value', e.target.value)}
                                        className="h-7 text-xs flex-1"
                                        placeholder="Valor"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-500"
                                        onClick={() => removePrice(idx)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPrice}
                                className="h-7 text-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Adicionar Preço
                            </Button>
                        </div>
                    ) : (
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
                    )}
                </div>

                <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-500" />
                        {isEditing ? (
                            <Input 
                                value={formData.type || ''} 
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="h-7 text-xs"
                                placeholder="Tipo do Imóvel"
                            />
                        ) : (
                            <span>{lote.type || 'Tipo não identificado'}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-500" />
                        {isEditing ? (
                            <div className="flex gap-1 w-full">
                                <Input 
                                    value={formData.city || ''} 
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="Cidade"
                                />
                                <Input 
                                    value={formData.state || ''} 
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    className="h-7 text-xs w-12"
                                    placeholder="UF"
                                />
                            </div>
                        ) : (
                            <span className="truncate">{lote.city || 'Cidade n/d'} - {lote.state || 'UF'}</span>
                        )}
                    </div>
                </div>
                
                <div className="mt-2">
                    {isEditing ? (
                        <Textarea 
                            value={formData.description || formData.rawContent || ''} 
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="text-xs min-h-[100px]"
                            placeholder="Descrição do Lote"
                        />
                    ) : (
                        <p className="text-xs text-muted-foreground whitespace-pre-line">
                            {lote.description || lote.rawContent}
                        </p>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}
