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

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Oportunidades de Mercado (OLX)</h3>
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
