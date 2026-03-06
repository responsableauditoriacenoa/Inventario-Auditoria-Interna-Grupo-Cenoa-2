export type Category = 'A' | 'B' | 'C';

export interface Article {
  id: string;
  article: string;
  location: string;
  description: string;
  stock: number;
  cost: number;
  category: Category;
  physicalCount?: number;
  difference?: number;
  justification?: string;
  isValidated?: boolean;
  adjustmentType?: 'Ajuste' | 'Canje' | 'Sin Ajuste' | '';
  adjustmentQuantity?: number;
}

export interface Inventory {
  id: string;
  date: string;
  concessionaire: string;
  branch: string;
  auditor: string;
  status: 'Abierto' | 'Cerrado';
  articles: Article[];
  closureDate?: string;
  closureUser?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Auditor' | 'Deposito' | 'admin';
}
