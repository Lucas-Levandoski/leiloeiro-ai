export interface MarketAnalysis {
  id: string;
  lote_id: string;
  title: string;
  price?: string;
  url: string;
  description?: string;
  source: string;
  created_at: string;
}

export interface MarketAnalysisInput {
  lote_id: string;
  title: string;
  price?: string;
  url: string;
  description?: string;
  source?: string;
}
