export interface Lote {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  price?: string;
  estimated_price?: string;
  city?: string;
  state?: string;
  details?: any;
  created_at?: string;
  is_favorite?: boolean;
  projects?: Project;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  editalUrl?: string;
  createdAt: string;
  lotes?: Lote[];
  details?: {
    bankName?: string;
    auctionDate?: string[];
    auctionLocation?: string;
    auctioneer?: string;
    generalRules?: string;
    editalNumber?: string;
    [key: string]: any;
  };
}
