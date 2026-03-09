export type Category = 'A' | 'B' | 'C';

export interface Article {
  id: string;
  article: string;
  location: string;
  description: string;
  stock: number;
  cost: number;
  category: Category;
  sourceData?: Record<string, string | number>;
  physicalCount?: number;
  difference?: number;
  justification?: string;
  validatedStatus?: '' | 'SI' | 'NO';
  validatedBy?: string;
  validatedAt?: string;
  adjustmentType?: 'Ajuste' | 'Canje' | 'Sin Ajuste' | '';
  adjustmentQuantity?: number;
  counterpartArticleCode?: string;
}

export interface Inventory {
  id: string;
  date: string;
  concessionaire: string;
  branch: string;
  auditor: string;
  status: 'Abierto' | 'Cerrado';
  articles: Article[];
  importColumns?: string[];
  extraColumns?: string[];
  closureDate?: string;
  closureUser?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Auditor' | 'Deposito' | 'admin';
}
