'use client';

import { useState, useEffect } from 'react';
import { MarketAnalysis } from '@/modules/projects/models/MarketAnalysis';
import { searchLoteMarketOpportunities, getLoteMarketAnalysis } from '@/actions/market-analysis';
import { Button } from '@/components/ui/button';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { MarketAnalysisList } from './MarketAnalysisList';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MarketAnalysisSectionProps {
  loteId: string;
  onAnalysisUpdate?: (averagePrice: number) => void;
}

export function MarketAnalysisSection({ loteId, onAnalysisUpdate }: MarketAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<MarketAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [loteId]);

  useEffect(() => {
    if (analysis.length > 0 && onAnalysisUpdate) {
      const averagePrice = calculateAveragePrice(analysis);
      if (averagePrice > 0) {
        onAnalysisUpdate(averagePrice);
      }
    }
  }, [analysis, onAnalysisUpdate]);

  const calculateAveragePrice = (items: MarketAnalysis[]) => {
    if (!items || items.length === 0) return 0;
    
    let validPrices = 0;
    const total = items.reduce((acc, item) => {
      // Remove R$, dots and replace comma with dot
      const priceString = item.price?.toString().replace(/[^\d,]/g, '').replace(',', '.') || '0';
      const price = parseFloat(priceString);
      
      if (!isNaN(price) && price > 0) {
        validPrices++;
        return acc + price;
      }
      return acc;
    }, 0);

    return validPrices > 0 ? total / validPrices : 0;
  };

  const loadAnalysis = async () => {
    try {
      const data = await getLoteMarketAnalysis(loteId);
      if (data) {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await searchLoteMarketOpportunities(loteId);
      if (result.success) {
        toast.success(`Encontradas ${result.count} oportunidades!`);
        await loadAnalysis();
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      toast.error('Erro ao buscar oportunidades no mercado');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="h-20 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="bg-transparent">
      <div className="pb-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xl font-bold flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <TrendingUp className="h-5 w-5" />
              Análise de Mercado
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Compare com outras oportunidades similares na região (OLX)
            </div>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Buscar Oportunidades
          </Button>
        </div>
      </div>
      <div>
        {analysis.length > 0 ? (
          <MarketAnalysisList analysis={analysis} />
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-white/50 dark:bg-slate-950/30 rounded-lg border border-dashed border-blue-200 dark:border-blue-800">
            <p>Nenhuma análise realizada ainda.</p>
            <p className="text-sm">Clique em "Buscar Oportunidades" para pesquisar imóveis similares na região.</p>
          </div>
        )}
      </div>
    </div>
  );
}
