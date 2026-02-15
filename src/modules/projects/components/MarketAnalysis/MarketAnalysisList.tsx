'use client';

import { MarketAnalysis } from '@/modules/projects/models/MarketAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface MarketAnalysisListProps {
  analysis: MarketAnalysis[];
}

export function MarketAnalysisList({ analysis }: MarketAnalysisListProps) {
  if (!analysis || analysis.length === 0) {
    return null;
  }

  const calculateAveragePrice = () => {
    if (!analysis || analysis.length === 0) return 0;
    
    let validPrices = 0;
    const total = analysis.reduce((acc, item) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const averagePrice = calculateAveragePrice();

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Oportunidades de Mercado (OLX)</h3>
        {averagePrice > 0 && (
          <div className="bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <span className="text-sm text-indigo-800 dark:text-indigo-200 font-medium mr-2">Média de Preço:</span>
            <span className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{formatCurrency(averagePrice)}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysis.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-lg text-primary">{item.price}</p>
                <p className="text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline mt-2"
                >
                  Ver anúncio <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
