import { Card, CardContent } from "@/components/ui/card";
import { BankLogo } from "@/components/BankLogo";
import { Gavel, Calendar, MapPin, ExternalLink } from "lucide-react";

interface AuctionDetails {
    bankName?: string;
    auctionDate?: string[];
    auctionLocation?: string;
    auctioneer?: string;
    [key: string]: any;
}

interface AuctionInfoCardProps {
    details: AuctionDetails;
}

export function AuctionInfoCard({ details }: AuctionInfoCardProps) {
    return (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
                {details.bankName && (
                    <div className="flex-shrink-0 bg-white dark:bg-slate-950 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm">
                        <BankLogo bankName={details.bankName} size="lg" />
                    </div>
                )}
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-lg">
                        <Gavel className="h-5 w-5" />
                        <span>Informações do Leilão</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {details.auctionDate && (
                            <div className="md:col-span-2 bg-white/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-800 p-4">
                                <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-200">
                                    <Calendar className="h-5 w-5" />
                                    <span className="font-semibold">Cronograma do Leilão</span>
                                </div>
                                <div className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-line leading-relaxed pl-1">
                                    <div className="flex flex-col gap-1">
                                        {details.auctionDate.map((date: string, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-indigo-400 dark:text-indigo-500">•</span>
                                                <span>{date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {details.auctionLocation && (
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {details.auctionLocation.match(/^(https?:\/\/|www\.)|(\.com|\.br|\.net|\.org)/i) ? (
                                    <a 
                                        href={details.auctionLocation.startsWith('http') ? details.auctionLocation : `https://${details.auctionLocation}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="truncate hover:underline flex items-center gap-1"
                                    >
                                        <span className="truncate">{details.auctionLocation}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                                    </a>
                                ) : (
                                    <span className="truncate">{details.auctionLocation}</span>
                                )}
                            </div>
                        )}
                        {details.auctioneer && (
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 md:col-span-2">
                                <span className="font-medium">Leiloeiro:</span>
                                <span>{details.auctioneer}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
