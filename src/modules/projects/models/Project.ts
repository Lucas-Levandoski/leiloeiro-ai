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
}

export interface Project {
  id: string;
  name: string;
  description: string;
  editalUrl?: string;
  municipalUrl?: string;
  price?: string;
  estimatedPrice?: string;
  createdAt: string;
  lotes?: Lote[];
}
