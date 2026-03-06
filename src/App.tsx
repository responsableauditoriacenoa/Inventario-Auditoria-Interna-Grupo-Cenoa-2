import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Package,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Inventory, Article, Category, User } from './types';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = 'cenoa-inventories-v1';
const SESSION_KEY = 'cenoa-session-v1';

const TEST_CREDENTIALS: Record<string, { password: string; role: User['role']; name: string }> = {
  diego_guantay: { password: 'DieguG123!', role: 'Auditor', name: 'Diego Guantay' },
  nancy_fernandez: { password: 'NancyF123!', role: 'Auditor', name: 'Nancy Fernandez' },
  gustavo_zambrano: { password: 'GustavoZ123!', role: 'Auditor', name: 'Gustavo Zambrano' },
  admin: { password: 'Admin123!', role: 'admin', name: 'Admin' },
  jefe_repuestos: { password: 'JefeRep123!', role: 'Deposito', name: 'Jefe de Repuestos' },
};

const CONCESIONARIAS: Record<string, string[]> = {
  Autolux: ['Ax Jujuy', 'Ax Salta', 'Ax Tartagal', 'Ax Lajitas', 'Ax Taller Movil'],
  Autosol: ['As Jujuy', 'As Salta', 'As Tartagal', 'As Taller Express', 'As Taller Movil'],
  Ciel: ['Ac Jujuy'],
  Portico: ['Las Lomas', 'Brown'],
};

const C_ART = 'Artículo';
const C_LOC = 'Locación';
const C_DESC = 'Descripción';
const C_STOCK = 'Stock';
const C_COSTO = 'Cto.Rep.';

type SourceArticle = Omit<Article, 'id' | 'category'>;

const BASE_ARTICLES: SourceArticle[] = [
  { article: 'FIL-001', location: 'EST-A1', description: 'Filtro de Aceite Hilux', stock: 50, cost: 1500 },
  { article: 'PAS-002', location: 'EST-B2', description: 'Pastillas de Freno Corolla', stock: 20, cost: 4500 },
  { article: 'BUJ-003', location: 'EST-C3', description: 'Bujía Iridium', stock: 100, cost: 800 },
  { article: 'ACE-004', location: 'EST-D4', description: 'Aceite Sintético 5W30', stock: 15, cost: 12000 },
  { article: 'LAM-005', location: 'EST-E5', description: 'Lámpara H7', stock: 200, cost: 350 },
  { article: 'FIL-006', location: 'EST-A2', description: 'Filtro de Aire Amarok', stock: 42, cost: 2300 },
  { article: 'FRE-007', location: 'EST-B1', description: 'Disco de Freno Delantero', stock: 18, cost: 17500 },
  { article: 'AMP-008', location: 'EST-C1', description: 'Amortiguador Trasero', stock: 24, cost: 21000 },
  { article: 'RUL-009', location: 'EST-D2', description: 'Rulemán de Rueda', stock: 30, cost: 5200 },
  { article: 'COJ-010', location: 'EST-E3', description: 'Cojinete de Empuje', stock: 27, cost: 6300 },
  { article: 'COR-011', location: 'EST-A3', description: 'Correa de Distribución', stock: 25, cost: 9800 },
  { article: 'BAT-012', location: 'EST-B3', description: 'Batería 12V 70Ah', stock: 12, cost: 98000 },
  { article: 'BOM-013', location: 'EST-C2', description: 'Bomba de Agua', stock: 17, cost: 14000 },
  { article: 'EMB-014', location: 'EST-D1', description: 'Embrague Completo', stock: 9, cost: 132000 },
  { article: 'RET-015', location: 'EST-E1', description: 'Retén de Cigüeñal', stock: 65, cost: 1800 },
];

const MOCK_INVENTORIES: Inventory[] = [
  {
    id: 'INV-20240306-001',
    date: '2024-03-06 09:00',
    concessionaire: 'Autolux',
    branch: 'Ax Jujuy',
    auditor: 'Diego Guantay',
    status: 'Abierto',
    articles: [
      { id: '1', article: 'FIL-001', location: 'EST-A1', description: 'Filtro de Aceite Hilux', stock: 50, cost: 1500, category: 'A', physicalCount: 49, difference: -1, justification: 'Faltante por entrega no registrada', validatedStatus: 'SI', adjustmentType: 'Ajuste', adjustmentQuantity: -1 },
      { id: '2', article: 'PAS-002', location: 'EST-B2', description: 'Pastillas de Freno Corolla', stock: 20, cost: 4500, category: 'A', physicalCount: 20, difference: 0, adjustmentType: 'Sin Ajuste', adjustmentQuantity: 0 },
      { id: '3', article: 'BUJ-003', location: 'EST-C3', description: 'Bujía Iridium', stock: 100, cost: 800, category: 'B', physicalCount: 102, difference: 2, justification: 'Ingreso pendiente de imputar', validatedStatus: 'SI', adjustmentType: 'Canje', adjustmentQuantity: 2 },
      { id: '4', article: 'ACE-004', location: 'EST-D4', description: 'Aceite Sintético 5W30', stock: 15, cost: 12000, category: 'A', physicalCount: 14, difference: -1, justification: 'Diferencia por rotura', validatedStatus: 'NO', adjustmentType: '', adjustmentQuantity: 0 },
      { id: '5', article: 'LAM-005', location: 'EST-E5', description: 'Lámpara H7', stock: 200, cost: 350, category: 'C', physicalCount: 200, difference: 0, adjustmentType: 'Sin Ajuste', adjustmentQuantity: 0 },
    ],
  },
];

type AppTab = 'dashboard' | 'new' | 'audit' | 'justification' | 'reports';

const Card = ({ children, className, title, subtitle, action, ...props }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, action?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm", className)} {...props}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          {title && <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>}
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: { title: string, value: string | number, icon: any, trend?: 'up' | 'down', trendValue?: string }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex items-start justify-between">
      <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
        <Icon className="w-5 h-5 text-zinc-600" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <h2 className="text-2xl font-bold text-zinc-900 mt-1">{value}</h2>
    </div>
  </Card>
);

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(value);
}

function generateInventoryId() {
  const now = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function pickRandom<T>(list: T[], n: number) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function parseArNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 0;
  }
  if (raw.includes(',')) {
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitAbcCategories(baseArticles: SourceArticle[]) {
  const valued = [...baseArticles]
    .map((item) => ({ ...item, totalValue: item.stock * item.cost }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const total = valued.reduce((acc, item) => acc + item.totalValue, 0);
  let acc = 0;
  const categorized = valued.map((item) => {
    acc += item.totalValue;
    const ratio = total > 0 ? acc / total : 0;
    const category: Category = ratio <= 0.8 ? 'A' : ratio <= 0.95 ? 'B' : 'C';
    return { ...item, category };
  });

  return {
    a: categorized.filter((x) => x.category === 'A'),
    b: categorized.filter((x) => x.category === 'B'),
    c: categorized.filter((x) => x.category === 'C'),
  };
}

function applyAbcSample(baseArticles: SourceArticle[]) {
  const { a, b, c } = splitAbcCategories(baseArticles);

  return [...pickRandom(a, 80), ...pickRandom(b, 15), ...pickRandom(c, 5)].map((item, index) => ({
    id: `${Date.now()}-${index}`,
    article: item.article,
    location: item.location,
    description: item.description,
    stock: item.stock,
    cost: item.cost,
    category: item.category,
    physicalCount: undefined,
    difference: 0,
    justification: '',
    validatedStatus: '',
    validatedBy: '',
    validatedAt: '',
    adjustmentType: '',
    adjustmentQuantity: 0,
  }));
}

function toNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function quantifyByCost(cost: number, quantity: number) {
  return toNumber(cost) * toNumber(quantity);
}

function calculateResults(articles: Article[]) {
  const normalized = articles.map((article) => ({
    ...article,
    stockN: toNumber(article.stock),
    costN: toNumber(article.cost),
    adjustmentN: toNumber(article.adjustmentQuantity ?? 0),
  }));

  const cantidadMuestra = normalized.reduce((acc, a) => acc + a.stockN, 0);
  const valorMuestra = normalized.reduce((acc, a) => acc + quantifyByCost(a.costN, a.stockN), 0);

  const ajustes = normalized.filter((a) => a.adjustmentType === 'Ajuste');
  const canjes = normalized.filter((a) => a.adjustmentType === 'Canje');

  const faltantes = ajustes.filter((a) => a.adjustmentN < 0);
  const sobrantes = ajustes.filter((a) => a.adjustmentN > 0);

  const cantidadFaltantes = faltantes.reduce((acc, a) => acc + Math.abs(a.adjustmentN), 0);
  const valorFaltantes = faltantes.reduce((acc, a) => acc + quantifyByCost(a.costN, Math.abs(a.adjustmentN)), 0);

  const cantidadSobrantes = sobrantes.reduce((acc, a) => acc + a.adjustmentN, 0);
  const valorSobrantes = sobrantes.reduce((acc, a) => acc + quantifyByCost(a.costN, a.adjustmentN), 0);

  const cantidadNeta = ajustes.reduce((acc, a) => acc + a.adjustmentN, 0);
  const valorNeta = ajustes.reduce((acc, a) => acc + quantifyByCost(a.costN, a.adjustmentN), 0);

  const cantidadAbsoluta = ajustes.reduce((acc, a) => acc + Math.abs(a.adjustmentN), 0);
  const valorAbsoluta = ajustes.reduce((acc, a) => acc + quantifyByCost(a.costN, Math.abs(a.adjustmentN)), 0);

  const pct = (value: number) => (valorMuestra > 0 ? (value / valorMuestra) * 100 : 0);
  const escala: Array<[number, number]> = [[0.0, 100], [0.1, 94], [0.8, 82], [1.6, 65], [2.4, 35], [3.3, 0]];
  const pctAbsoluto = pct(valorAbsoluta);

  let grado = 0;
  escala.forEach(([th, g]) => {
    if (pctAbsoluto >= th) {
      grado = g;
    }
  });

  return {
    cantidadMuestra,
    valorMuestra,
    cantidadFaltantes,
    valorFaltantes,
    cantidadSobrantes,
    valorSobrantes,
    cantidadNeta,
    valorNeta,
    cantidadAbsoluta,
    valorAbsoluta,
    pctMuestra: 100,
    pctFaltantes: pct(valorFaltantes),
    pctSobrantes: pct(valorSobrantes),
    pctNeta: pct(valorNeta),
    pctAbsoluta: pctAbsoluto,
    grado,
    canjes,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [inventories, setInventories] = useState<Inventory[]>(MOCK_INVENTORIES);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [importedRows, setImportedRows] = useState<SourceArticle[]>([]);
  const [importedFileName, setImportedFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [concessionaire, setConcessionaire] = useState('Autolux');
  const [branch, setBranch] = useState(CONCESIONARIAS.Autolux[0]);
  const [reportScope, setReportScope] = useState<'open' | 'closed'>('open');
  const [closedFilterConcessionaire, setClosedFilterConcessionaire] = useState<'Todas' | string>('Todas');
  const [closedFilterBranch, setClosedFilterBranch] = useState<'Todas' | string>('Todas');
  const [auditInventoryId, setAuditInventoryId] = useState('');
  const [justInventoryId, setJustInventoryId] = useState('');
  const [reportInventoryId, setReportInventoryId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Inventory[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInventories(parsed);
        }
      }
    } catch {
      setInventories(MOCK_INVENTORIES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventories));
  }, [inventories]);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem(SESSION_KEY);
      if (!rawSession) {
        return;
      }
      const parsed = JSON.parse(rawSession) as User;
      if (parsed?.id && parsed?.role && parsed?.name) {
        setCurrentUser(parsed);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const openInventories = useMemo(() => inventories.filter((inv) => inv.status === 'Abierto'), [inventories]);
  const closedInventories = useMemo(() => inventories.filter((inv) => inv.status === 'Cerrado'), [inventories]);
  const closedBranchesForSelectedConcessionaire = useMemo(() => {
    const source = closedFilterConcessionaire === 'Todas'
      ? closedInventories
      : closedInventories.filter((inv) => inv.concessionaire === closedFilterConcessionaire);
    return Array.from(new Set(source.map((inv) => inv.branch))).sort();
  }, [closedFilterConcessionaire, closedInventories]);

  const filteredClosedInventories = useMemo(() => {
    return closedInventories.filter((inv) => {
      const concessionaireMatch = closedFilterConcessionaire === 'Todas' || inv.concessionaire === closedFilterConcessionaire;
      const branchMatch = closedFilterBranch === 'Todas' || inv.branch === closedFilterBranch;
      return concessionaireMatch && branchMatch;
    });
  }, [closedFilterBranch, closedFilterConcessionaire, closedInventories]);

  const reportScopeInventories = reportScope === 'open' ? openInventories : filteredClosedInventories;
  const canAudit = currentUser?.role === 'Auditor' || currentUser?.role === 'admin';
  const canManageInventory = canAudit;
  const canValidate = canAudit;
  const canDepositJustify = currentUser?.role === 'Deposito';
  const importedSampleStats = useMemo(() => {
    if (importedRows.length === 0) {
      return { a: 80, b: 15, c: 5, total: 0 };
    }
    const { a, b, c } = splitAbcCategories(importedRows);
    return {
      a: Math.min(80, a.length),
      b: Math.min(15, b.length),
      c: Math.min(5, c.length),
      total: importedRows.length,
    };
  }, [importedRows]);

  useEffect(() => {
    if (!auditInventoryId && openInventories[0]) {
      setAuditInventoryId(openInventories[0].id);
    }
    if (!justInventoryId && openInventories[0]) {
      setJustInventoryId(openInventories[0].id);
    }
    if (!reportInventoryId && openInventories[0]) {
      setReportInventoryId(openInventories[0].id);
    }
  }, [auditInventoryId, justInventoryId, openInventories, reportInventoryId]);

  useEffect(() => {
    if (reportScope === 'open' && openInventories.length === 0 && closedInventories.length > 0) {
      setReportScope('closed');
      return;
    }
    if (reportScope === 'closed' && closedInventories.length === 0 && openInventories.length > 0) {
      setReportScope('open');
    }
  }, [closedInventories.length, openInventories.length, reportScope]);

  useEffect(() => {
    if (reportScope !== 'closed') {
      return;
    }
    if (closedFilterConcessionaire !== 'Todas') {
      const exists = closedInventories.some((inv) => inv.concessionaire === closedFilterConcessionaire);
      if (!exists) {
        setClosedFilterConcessionaire('Todas');
      }
    }
  }, [closedFilterConcessionaire, closedInventories, reportScope]);

  useEffect(() => {
    if (closedFilterBranch === 'Todas') {
      return;
    }
    if (!closedBranchesForSelectedConcessionaire.includes(closedFilterBranch)) {
      setClosedFilterBranch('Todas');
    }
  }, [closedBranchesForSelectedConcessionaire, closedFilterBranch]);

  useEffect(() => {
    if (reportScopeInventories.length === 0) {
      setReportInventoryId('');
      return;
    }
    const exists = reportScopeInventories.some((inv) => inv.id === reportInventoryId);
    if (!exists) {
      setReportInventoryId(reportScopeInventories[0].id);
    }
  }, [reportInventoryId, reportScopeInventories]);

  const updateInventoryArticles = (inventoryId: string, updater: (articles: Article[]) => Article[]) => {
    setInventories((prev) => prev.map((inv) => (inv.id === inventoryId ? { ...inv, articles: updater(inv.articles) } : inv)));
  };

  const saveArticlePatch = (inventoryId: string, articleId: string, patch: Partial<Article>) => {
    updateInventoryArticles(inventoryId, (articles) =>
      articles.map((article) => {
        if (article.id !== articleId) {
          return article;
        }
        const updated = { ...article, ...patch };
        const physical = updated.physicalCount;
        if (physical === undefined || physical === null || Number.isNaN(physical)) {
          updated.difference = 0;
        } else {
          updated.difference = Number(physical) - Number(updated.stock);
        }
        return updated;
      }),
    );
  };

  const saveValidationStatus = (inventoryId: string, articleId: string, status: '' | 'SI' | 'NO') => {
    const basePatch: Partial<Article> = {
      validatedStatus: status,
      validatedBy: currentUser?.id ?? '',
      validatedAt: new Date().toISOString(),
    };

    if (status !== 'SI') {
      basePatch.adjustmentType = '';
      basePatch.adjustmentQuantity = 0;
    }

    saveArticlePatch(inventoryId, articleId, basePatch);
  };

  const stats = useMemo(() => {
    const allArticles = inventories.flatMap((inv) => inv.articles);
    const totalValue = allArticles.reduce((acc, art) => acc + art.stock * art.cost, 0);
    const discrepancyValue = allArticles.reduce((acc, art) => acc + Math.abs((art.difference ?? 0) * art.cost), 0);
    const pendingJustifications = allArticles.filter((art) => (art.difference ?? 0) !== 0 && !art.justification).length;
    const discrepancyRate = totalValue > 0 ? ((discrepancyValue / totalValue) * 100).toFixed(2) : '0.00';
    return {
      totalValue: formatCurrency(totalValue),
      activeCount: openInventories.length,
      discrepancyRate: `${discrepancyRate}%`,
      pendingJustifications,
    };
  }, [inventories, openInventories.length]);

  const runAiAnalysis = async () => {
    if (!process.env.GEMINI_API_KEY) {
      setAiAnalysis("Error: No se encontró la API Key de Gemini. Configúrela en los secretos de GitHub Actions si está desplegando en GitHub Pages.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: "Analiza estos datos de inventario y dame 3 insights rápidos sobre discrepancias y valorización ABC para el Grupo Cenoa. Sé profesional y directo." }] }]
      });
      setAiAnalysis(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      setAiAnalysis("Error conectando con el asistente inteligente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUser = loginUserId.trim();
    const found = TEST_CREDENTIALS[normalizedUser];
    if (!found) {
      setLoginError('Usuario no encontrado');
      return;
    }
    if (found.password !== loginPassword) {
      setLoginError('Contraseña incorrecta');
      return;
    }
    setCurrentUser({ id: normalizedUser, name: found.name, role: found.role });
    setLoginError('');
    setLoginPassword('');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUserId('');
    setLoginPassword('');
    setLoginError('');
    setActiveTab('dashboard');
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportError('');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const headerRows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, blankrows: false });
      const headers = (headerRows[0] ?? []).map((h) => String(h).trim());
      const requiredColumns = [C_ART, C_LOC, C_DESC, C_STOCK, C_COSTO];
      const missing = requiredColumns.filter((column) => !headers.includes(column));

      if (missing.length > 0) {
        setImportError(`Faltan columnas obligatorias: ${missing.join(', ')}`);
        setImportedRows([]);
        setImportedFileName('');
        return;
      }

      const dataRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      const normalized: SourceArticle[] = dataRows
        .map((row) => ({
          article: String(row[C_ART] ?? '').trim(),
          location: String(row[C_LOC] ?? '').trim(),
          description: String(row[C_DESC] ?? '').trim(),
          stock: parseArNumber(row[C_STOCK]),
          cost: parseArNumber(row[C_COSTO]),
        }))
        .filter((row) => row.article && row.location);

      if (normalized.length === 0) {
        setImportError('El archivo no contiene filas válidas para procesar.');
        setImportedRows([]);
        setImportedFileName('');
        return;
      }

      setImportedRows(normalized);
      setImportedFileName(file.name);
      setImportError('');
    } catch {
      setImportError('No se pudo leer el archivo Excel. Verificá formato y estructura.');
      setImportedRows([]);
      setImportedFileName('');
    } finally {
      event.target.value = '';
    }
  };

  const createInventory = () => {
    if (!currentUser || !canManageInventory) {
      return;
    }
    if (importedRows.length === 0) {
      setImportError('Debes importar un Excel válido para generar el inventario.');
      setActiveTab('new');
      return;
    }
    const id = generateInventoryId();
    if (inventories.some((inv) => inv.id === id)) {
      return;
    }
    const articles = applyAbcSample(importedRows.length > 0 ? importedRows : BASE_ARTICLES);
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const next: Inventory = {
      id,
      date,
      concessionaire,
      branch,
      auditor: currentUser.name,
      status: 'Abierto',
      articles,
      closureDate: '',
      closureUser: '',
    };
    setInventories((prev) => [next, ...prev]);
    setAuditInventoryId(id);
    setJustInventoryId(id);
    setReportInventoryId(id);
    setImportedRows([]);
    setImportedFileName('');
    setImportError('');
    setActiveTab('audit');
  };

  const auditInventory = openInventories.find((inv) => inv.id === auditInventoryId);
  const justInventory = openInventories.find((inv) => inv.id === justInventoryId);
  const reportInventory = reportScopeInventories.find((inv) => inv.id === reportInventoryId);
  const reportResults = useMemo(() => calculateResults(reportInventory?.articles ?? []), [reportInventory]);

  const closeInventory = (inventoryId: string) => {
    if (!currentUser || !canManageInventory) {
      return;
    }
    const now = new Date();
    const closureDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setInventories((prev) =>
      prev.map((inv) =>
        inv.id === inventoryId
          ? { ...inv, status: 'Cerrado', closureDate, closureUser: currentUser.id }
          : inv,
      ),
    );
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Valor Total Stock" value={stats.totalValue} icon={Package} trend="up" trendValue="+12%" />
              <StatCard title="Inventarios Activos" value={stats.activeCount} icon={ClipboardCheck} />
              <StatCard title="Tasa Discrepancia" value={stats.discrepancyRate} icon={AlertTriangle} trend="down" trendValue="-0.5%" />
              <StatCard title="Justificaciones Pendientes" value={stats.pendingJustifications} icon={MessageSquareQuote} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2" title="Inventarios recientes" subtitle="Estado y trazabilidad">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Concesionaria</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Sucursal</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {inventories.slice(0, 8).map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-3 text-xs font-mono text-zinc-700">{inv.id}</td>
                          <td className="px-4 py-3 text-xs text-zinc-600">{inv.date}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{inv.concessionaire}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{inv.branch}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-[10px] px-2 py-1 rounded-full border font-bold', inv.status === 'Abierto' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 text-zinc-700 border-zinc-200')}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="space-y-6">
                <Card title="Asistente Inteligente" subtitle="Análisis predictivo de stock" className="bg-zinc-900 text-white border-zinc-800">
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {aiAnalysis || "Haga clic en analizar para obtener insights basados en IA sobre su inventario actual."}
                      </p>
                    </div>
                    <button 
                      onClick={runAiAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-2 bg-white text-zinc-900 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Analizar con IA
                    </button>
                  </div>
                </Card>

                <Card title="Flujo operativo" className="p-0">
                  <div className="divide-y divide-zinc-100 text-xs">
                    {['1) Nuevo inventario (ABC)', '2) Conteo físico', '3) Justificaciones y ajustes', '4) Cierre con grado'].map((step) => (
                      <div key={step} className="p-4 text-zinc-700 font-medium">{step}</div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'new':
        if (!canManageInventory) {
          return <Card><p className="text-sm text-zinc-500">Solo Auditores o admin pueden generar inventarios.</p></Card>;
        }
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Nuevo Inventario</h2>
              <button className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <div className="space-y-6">
                  <label className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center space-y-4 hover:border-zinc-400 transition-colors cursor-pointer group block">
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Subir Reporte de Stock (.xlsx)</p>
                      <p className="text-xs text-zinc-500 mt-1">Columnas requeridas: Artículo, Locación, Descripción, Stock, Cto.Rep.</p>
                      {importedFileName && <p className="text-xs text-emerald-700 mt-2 font-semibold">Archivo cargado: {importedFileName}</p>}
                    </div>
                  </label>

                  {importError && <p className="text-xs text-rose-600 font-semibold">{importError}</p>}

                  {importedRows.length > 0 && (
                    <div className="border border-zinc-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-zinc-700 mb-3">Vista previa de importación ({importedRows.length} filas)</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                              <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Artículo</th>
                              <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Locación</th>
                              <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Descripción</th>
                              <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Stock</th>
                              <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Costo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs">
                            {importedRows.slice(0, 8).map((row, index) => (
                              <tr key={`${row.article}-${row.location}-${index}`}>
                                <td className="px-3 py-2 font-mono">{row.article}</td>
                                <td className="px-3 py-2 font-mono">{row.location}</td>
                                <td className="px-3 py-2">{row.description}</td>
                                <td className="px-3 py-2 text-right">{row.stock}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(row.cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Concesionaria</label>
                      <select
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                        value={concessionaire}
                        onChange={(e) => {
                          const next = e.target.value;
                          setConcessionaire(next);
                          setBranch(CONCESIONARIAS[next][0]);
                        }}
                      >
                        {Object.keys(CONCESIONARIAS).map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Sucursal</label>
                      <select
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      >
                        {CONCESIONARIAS[concessionaire].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Resumen ABC" className="bg-zinc-50 border-zinc-200">
                <div className="space-y-6">
                    <p className="text-xs text-zinc-500 leading-relaxed">El sistema aplica la regla 80/15/5 y prepara los campos de conteo, diferencia, justificación y ajuste para iniciar el flujo.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat A (80%)</span>
                      <span className="font-bold text-zinc-900">{importedSampleStats.a} items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[80%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat B (15%)</span>
                      <span className="font-bold text-zinc-900">{importedSampleStats.b} items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[15%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat C (5%)</span>
                      <span className="font-bold text-zinc-900">{importedSampleStats.c} items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-zinc-400 h-full w-[5%]" />
                    </div>
                    {importedSampleStats.total > 0 && (
                      <p className="text-[11px] text-zinc-500">Total filas importadas: {importedSampleStats.total}</p>
                    )}
                  </div>
                  <button
                    onClick={createInventory}
                    className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all"
                  >
                    Generar Inventario
                  </button>
                </div>
              </Card>
            </div>
          </div>
        );
      case 'audit':
        if (!canAudit) {
          return <Card><p className="text-sm text-zinc-500">Solo Auditores o admin pueden cargar conteo físico.</p></Card>;
        }
        if (openInventories.length === 0) {
          return <Card><p className="text-sm text-zinc-500">No hay inventarios abiertos para carga de conteo físico.</p></Card>;
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Auditoría en Curso</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Cargar conteos y calcular diferencias contra stock sistema.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={auditInventoryId}
                  onChange={(e) => setAuditInventoryId(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold"
                >
                  {openInventories.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.id}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Búsqueda visual (MVP)" 
                    className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all w-64"
                  />
                </div>
              </div>
            </div>

            <Card className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Artículo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Locación</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Stock Sist.</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Cat</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-32">Conteo Físico</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Dif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {auditInventory?.articles.map((art) => (
                    <tr key={art.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-zinc-900">{art.article}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{art.location}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{art.description}</td>
                      <td className="px-6 py-4 text-sm text-zinc-900 text-right font-mono font-medium">{art.stock}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          art.category === 'A' ? "bg-rose-50 text-rose-700 border-rose-100" :
                          art.category === 'B' ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-zinc-50 text-zinc-600 border-zinc-200"
                        )}>
                          {art.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-center font-bold"
                          placeholder="-"
                          value={art.physicalCount ?? ''}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            const parsed = value === '' ? undefined : Number(value);
                            saveArticlePatch(auditInventoryId, art.id, { physicalCount: parsed });
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn('text-sm font-mono', (art.difference ?? 0) === 0 ? 'text-zinc-400' : (art.difference ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          {art.difference ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-xs text-zinc-500">Mostrando {auditInventory?.articles.length ?? 0} artículos de la muestra ABC</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('justification')}
                    className="px-6 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors"
                  >
                    Ir a Justificaciones
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all"
                  >
                    Finalizar Conteo
                  </button>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'justification':
        if (openInventories.length === 0) {
          return <Card><p className="text-sm text-zinc-500">No hay inventarios abiertos para justificar.</p></Card>;
        }
        const differenceRows = (justInventory?.articles ?? []).filter((art) => (art.difference ?? 0) !== 0);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Justificación de Diferencias</h2>
              <select
                value={justInventoryId}
                onChange={(e) => setJustInventoryId(e.target.value)}
                className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold"
              >
                {openInventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.id}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold">{differenceRows.length} Discrepancias</span>
              </div>
            </div>

            {canDepositJustify && (
              <p className="text-xs text-zinc-500">Perfil Depósito: completá únicamente la justificación de cada diferencia.</p>
            )}
            {canValidate && (
              <p className="text-xs text-zinc-500">Perfil Auditor: validá cada justificación y definí Tipo de Ajuste cuando corresponda (SI).</p>
            )}

            <div className="grid grid-cols-1 gap-4">
              {differenceRows.length === 0 && <Card><p className="text-sm text-emerald-700 font-medium">Sin diferencias para justificar en este inventario.</p></Card>}
              {differenceRows.map((item) => (
                <Card key={item.id} className="flex flex-col md:flex-row gap-6 p-0 overflow-hidden">
                  <div className="w-full md:w-64 bg-zinc-50 p-6 border-r border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Artículo</p>
                    <h4 className="text-lg font-bold text-zinc-900">{item.article}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Sist.</p>
                        <p className="text-sm font-bold text-zinc-900">{item.stock}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Físico</p>
                        <p className="text-sm font-bold text-rose-600">{item.physicalCount ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Justificación del Depósito</label>
                      <textarea 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 min-h-[100px]"
                        placeholder="Explique el motivo de la diferencia..."
                        value={item.justification ?? ''}
                        onChange={(e) => saveArticlePatch(justInventoryId, item.id, { justification: e.target.value })}
                        disabled={!canDepositJustify}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <select
                          className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none"
                          value={item.validatedStatus ?? ''}
                          onChange={(e) => saveValidationStatus(justInventoryId, item.id, e.target.value as '' | 'SI' | 'NO')}
                          disabled={!canValidate}
                        >
                          <option value="">¿Validada?</option>
                          <option value="SI">SI</option>
                          <option value="NO">NO</option>
                        </select>
                        <select
                          className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none"
                          value={item.adjustmentType ?? ''}
                          onChange={(e) => saveArticlePatch(justInventoryId, item.id, { adjustmentType: e.target.value as Article['adjustmentType'] })}
                          disabled={!canValidate || item.validatedStatus !== 'SI'}
                        >
                          <option value="">Seleccionar</option>
                          <option>Ajuste</option>
                          <option>Canje</option>
                          <option>Sin Ajuste</option>
                        </select>
                        {(item.adjustmentType === 'Ajuste' || item.adjustmentType === 'Canje') && (
                          <input
                            type="number"
                            className="w-24 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs"
                            value={item.adjustmentQuantity ?? 0}
                            onChange={(e) => saveArticlePatch(justInventoryId, item.id, { adjustmentQuantity: Number(e.target.value) })}
                            disabled={!canValidate || item.validatedStatus !== 'SI'}
                          />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-zinc-500">Dif: {item.difference ?? 0}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'reports':
        if (!canManageInventory) {
          return <Card><p className="text-sm text-zinc-500">Solo Auditores o admin pueden cerrar y reportar inventarios.</p></Card>;
        }
        if (openInventories.length === 0 && closedInventories.length === 0) {
          return <Card><p className="text-sm text-zinc-500">No hay inventarios disponibles para visualizar reportes.</p></Card>;
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Cierre + Reporte</h2>
              <div className="flex items-center gap-2">
                <select
                  value={reportScope}
                  onChange={(e) => setReportScope(e.target.value as 'open' | 'closed')}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold"
                >
                  <option value="open">Inventarios Abiertos</option>
                  <option value="closed">Inventarios Cerrados</option>
                </select>
                <select
                  value={reportInventoryId}
                  onChange={(e) => setReportInventoryId(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold"
                  disabled={reportScopeInventories.length === 0}
                >
                  {reportScopeInventories.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {reportScope === 'closed' && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Concesionaria</label>
                    <select
                      value={closedFilterConcessionaire}
                      onChange={(e) => {
                        const next = e.target.value;
                        setClosedFilterConcessionaire(next);
                        setClosedFilterBranch('Todas');
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="Todas">Todas</option>
                      {Array.from(new Set(closedInventories.map((inv) => inv.concessionaire))).sort().map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Sucursal</label>
                    <select
                      value={closedFilterBranch}
                      onChange={(e) => setClosedFilterBranch(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="Todas">Todas</option>
                      {closedBranchesForSelectedConcessionaire.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {reportInventory && reportScope === 'closed' && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <p><span className="font-semibold">Estado:</span> Cerrado</p>
                  <p><span className="font-semibold">Fecha de cierre:</span> {reportInventory.closureDate || '-'}</p>
                  <p><span className="font-semibold">Usuario cierre:</span> {reportInventory.closureUser || '-'}</p>
                </div>
              </Card>
            )}

            {!reportInventory && (
              <Card><p className="text-sm text-zinc-500">No hay inventarios en el estado seleccionado.</p></Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Muestra" value={reportResults.cantidadMuestra} icon={Package} />
              <StatCard title="Faltantes" value={reportResults.cantidadFaltantes} icon={AlertTriangle} trend="down" trendValue={`${reportResults.pctFaltantes.toFixed(2)}%`} />
              <StatCard title="Sobrantes" value={reportResults.cantidadSobrantes} icon={CheckCircle2} trend="up" trendValue={`${reportResults.pctSobrantes.toFixed(2)}%`} />
              <StatCard title="Grado" value={`${reportResults.grado}%`} icon={ClipboardCheck} />
            </div>

            <Card title="Resultado de Inventario">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Detalle</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Q</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">$ Cuantificación</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {[
                    { d: 'Muestra', q: reportResults.cantidadMuestra, v: reportResults.valorMuestra, p: reportResults.pctMuestra },
                    { d: 'Faltantes', q: reportResults.cantidadFaltantes, v: reportResults.valorFaltantes, p: reportResults.pctFaltantes },
                    { d: 'Sobrantes', q: reportResults.cantidadSobrantes, v: reportResults.valorSobrantes, p: reportResults.pctSobrantes },
                    { d: 'Dif Neta', q: reportResults.cantidadNeta, v: reportResults.valorNeta, p: reportResults.pctNeta },
                    { d: 'Dif Absoluta', q: reportResults.cantidadAbsoluta, v: reportResults.valorAbsoluta, p: reportResults.pctAbsoluta },
                  ].map((row) => (
                    <tr key={row.d}>
                      <td className="px-4 py-3">{row.d}</td>
                      <td className="px-4 py-3">{row.q}</td>
                      <td className="px-4 py-3">{formatCurrency(row.v)}</td>
                      <td className="px-4 py-3">{row.p.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {reportResults.canjes.length > 0 && (
              <Card title="Canjes registrados">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Artículo</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Locación</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">Valor total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {reportResults.canjes.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.article}</td>
                        <td className="px-4 py-3">{item.location}</td>
                        <td className="px-4 py-3">{item.adjustmentQuantity ?? 0}</td>
                        <td className="px-4 py-3">{formatCurrency((item.adjustmentQuantity ?? 0) * item.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {reportScope === 'open' && reportInventory && (
              <div className="flex justify-end">
                <button
                  onClick={() => closeInventory(reportInventoryId)}
                  className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all"
                >
                  Cerrar Inventario
                </button>
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-12 text-center text-zinc-400">Próximamente...</div>;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Acceso al sistema" subtitle="Inventarios Rotativos - Grupo Cenoa">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Usuario (ID)</label>
                <input
                  value={loginUserId}
                  onChange={(e) => setLoginUserId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="Ej: diego_guantay"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Contraseña</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                />
              </div>
              {loginError && <p className="text-xs text-rose-600 font-semibold">{loginError}</p>}
              <button type="submit" className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all">
                Ingresar
              </button>
            </form>
          </Card>

          <Card title="Credenciales de prueba" subtitle="Replicadas desde el sistema fuente">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Usuario</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Contraseña</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {Object.entries(TEST_CREDENTIALS).map(([userId, data]) => (
                    <tr key={userId}>
                      <td className="px-3 py-2 font-mono">{userId}</td>
                      <td className="px-3 py-2">{data.password}</td>
                      <td className="px-3 py-2">{data.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex font-sans selection:bg-zinc-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">Cenoa Pro</h1>
            <p className="text-[10px] text-zinc-400 font-medium mt-1 uppercase tracking-widest">Inventory MS</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'new', label: 'Nuevo Inventario', icon: Plus },
            { id: 'audit', label: 'Conteo Físico', icon: ClipboardCheck },
            { id: 'justification', label: 'Justificaciones', icon: MessageSquareQuote },
            { id: 'reports', label: 'Reportes', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/10" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-zinc-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-900 shadow-sm">
              {currentUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium transition-all group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Inventarios</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-900 font-semibold capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live System</span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-3">
              <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight capitalize">{activeTab}</h1>
                <p className="text-sm text-zinc-500">Lógica operativa basada en el flujo de app.py (ABC, conteo, justificación, ajustes y cierre).</p>
              </div>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
