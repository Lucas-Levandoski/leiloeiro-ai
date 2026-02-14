'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLoteById, toggleLoteFavorite } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building2, MapPin, DollarSign, FileText, Star, Gavel, Calendar, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BankLogo } from "@/components/BankLogo";

interface LoteViewProps {
  loteId: string;
  projectId: string;
}

export default function LoteView({ loteId, projectId }: LoteViewProps) {
  const [lote, setLote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!loteId || loteId === 'undefined') {
        setLoading(false);
        return;
    }

    const fetchLote = async () => {
      try {
        const data = await getLoteById(loteId);
        setLote(data);
        setIsFavorite(data?.is_favorite || false);
      } catch (error) {
        console.error("Error fetching lote:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLote();
  }, [loteId]);

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
        const newStatus = !isFavorite;
        const result = await toggleLoteFavorite(loteId, newStatus);
        if (result.success) {
            setIsFavorite(newStatus);
            toast.success(newStatus ? "Adicionado aos favoritos" : "Removido dos favoritos");
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event("project-update"));
        } else {
            toast.error("Erro ao atualizar favorito");
        }
    } catch (error) {
        console.error(error);
        toast.error("Erro ao atualizar favorito");
    } finally {
        setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Lote não encontrado.</p>
        <Button asChild>
            <Link href={`/portal/projects/${projectId}`}>Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-6 pb-0">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
                <Link href={`/portal/projects/${projectId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Projeto
                </Link>
            </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <div className="max-w-4xl mx-auto space-y-6 pb-10">

        {/* Auction Info Card */}
        {lote.projects?.details && (
            <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
                    {lote.projects.details.bankName && (
                        <div className="flex-shrink-0 bg-white dark:bg-slate-950 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm">
                            <BankLogo bankName={lote.projects.details.bankName} size="lg" />
                        </div>
                    )}
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-lg">
                            <Gavel className="h-5 w-5" />
                            <span>Informações do Leilão</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                             {lote.projects.details.auctionDate && (
                                <div className="md:col-span-2 bg-white/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-800 p-4">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-200">
                                        <Calendar className="h-5 w-5" />
                                        <span className="font-semibold">Cronograma do Leilão</span>
                                    </div>
                                    <div className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-line leading-relaxed pl-1">
                                      <div className="flex flex-col gap-1">
                                          {lote.projects.details.auctionDate.map((date: string, idx: number) => (
                                              <div key={idx} className="flex items-start gap-2">
                                                  <span className="text-indigo-400 dark:text-indigo-500">•</span>
                                                  <span>{date}</span>
                                              </div>
                                          ))}
                                      </div>
                                     </div>
                                </div>
                             )}
                             {lote.projects.details.auctionLocation && (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    {lote.projects.details.auctionLocation.match(/^(https?:\/\/|www\.)|(\.com|\.br|\.net|\.org)/i) ? (
                                        <a 
                                            href={lote.projects.details.auctionLocation.startsWith('http') ? lote.projects.details.auctionLocation : `https://${lote.projects.details.auctionLocation}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="truncate hover:underline flex items-center gap-1"
                                        >
                                            <span className="truncate">{lote.projects.details.auctionLocation}</span>
                                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                                        </a>
                                    ) : (
                                        <span className="truncate">{lote.projects.details.auctionLocation}</span>
                                    )}
                                </div>
                             )}
                             {lote.projects.details.auctioneer && (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 md:col-span-2">
                                    <span className="font-medium">Leiloeiro:</span>
                                    <span>{lote.projects.details.auctioneer}</span>
                                </div>
                             )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-bold text-foreground">{lote.title}</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                            <Star className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`} />
                        </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                        <span className="text-muted-foreground">Criado em: {new Date(lote.created_at).toLocaleDateString()}</span>
                    </CardDescription>
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Price Section */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-3">
                            <DollarSign className="h-4 w-4" />
                            Valores de Leilão
                        </div>
                        {lote.auction_prices && lote.auction_prices.length > 0 ? (
                            <div className="space-y-3">
                                {lote.auction_prices.map((price: any, idx: number) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-green-200 dark:border-green-800 last:border-0 pb-2 last:pb-0">
                                        <span className="text-green-800 dark:text-green-300 text-sm font-medium uppercase tracking-wide">{price.label}</span>
                                        <span className="text-xl font-bold text-green-900 dark:text-green-100">{price.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-lg text-muted-foreground">
                                Valores não informados
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Localização
                        </h3>
                        <div className="space-y-2 text-muted-foreground">
                            <p><span className="font-medium text-foreground">Cidade:</span> {lote.city || "-"}</p>
                            <p><span className="font-medium text-foreground">Estado:</span> {lote.state || "-"}</p>
                            <p><span className="font-medium text-foreground">Endereço:</span> {lote.details?.address || "-"}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Detalhes do Imóvel
                        </h3>
                        <div className="space-y-2 text-muted-foreground">
                            <p><span className="font-medium text-foreground">Tipo:</span> {lote.details?.type || "-"}</p>
                            <p><span className="font-medium text-foreground">Área/Tamanho:</span> {lote.details?.size || "-"}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Full Description */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Descrição Completa
                    </h3>
                    <div className="bg-gray-50 dark:bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {lote.description || lote.details?.rawContent || "Sem descrição disponível."}
                    </div>
                </div>

                {/* Raw JSON Details (Debug/Advanced) */}
                {lote.details && (
                    <div className="mt-8">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dados Brutos (JSON)</h4>
                        <pre className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-300 p-4 rounded-md text-xs overflow-x-auto border border-slate-200 dark:border-slate-800">
                            {JSON.stringify(lote.details, null, 2)}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
