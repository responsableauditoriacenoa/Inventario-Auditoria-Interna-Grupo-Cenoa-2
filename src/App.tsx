import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardCheck, 
  MessageSquareQuote, 
  FileText, 
  LogOut, 
  Plus, 
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Download,
  Filter,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Inventory, Article, Category, User } from './types';
import { GoogleGenAI } from "@google/genai";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const MOCK_USER: User = {
  id: 'diego_guantay',
  name: 'Diego Guantay',
  role: 'Auditor'
};

const MOCK_INVENTORIES: Inventory[] = [
  {
    id: 'INV-20240306-001',
    date: '2024-03-06 09:00',
    concessionaire: 'Autolux',
    branch: 'Ax Jujuy',
    auditor: 'Diego Guantay',
    status: 'Abierto',
    articles: [
      { id: '1', article: 'FIL-001', location: 'EST-A1', description: 'Filtro de Aceite Hilux', stock: 50, cost: 1500, category: 'A' },
      { id: '2', article: 'PAS-002', location: 'EST-B2', description: 'Pastillas de Freno Corolla', stock: 20, cost: 4500, category: 'A' },
      { id: '3', article: 'BUJ-003', location: 'EST-C3', description: 'Bujía Iridium', stock: 100, cost: 800, category: 'B' },
      { id: '4', article: 'ACE-004', location: 'EST-D4', description: 'Aceite Sintético 5W30', stock: 15, cost: 12000, category: 'A' },
      { id: '5', article: 'LAM-005', location: 'EST-E5', description: 'Lámpara H7', stock: 200, cost: 350, category: 'C' },
    ]
  }
];

// Components
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new' | 'audit' | 'justification' | 'reports'>('dashboard');
  const [inventories, setInventories] = useState<Inventory[]>(MOCK_INVENTORIES);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalValue = inventories.reduce((acc, inv) => 
      acc + inv.articles.reduce((a, art) => a + (art.stock * art.cost), 0), 0
    );
    const activeCount = inventories.filter(i => i.status === 'Abierto').length;
    return {
      totalValue: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalValue),
      activeCount,
      discrepancyRate: '1.8%',
      pendingJustifications: 8
    };
  }, [inventories]);

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
              <Card className="lg:col-span-2" title="Distribución ABC" subtitle="Valorización de stock por categoría" action={<TrendingUp className="w-4 h-4 text-zinc-400" />}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Ene', value: 4000 },
                      { name: 'Feb', value: 3000 },
                      { name: 'Mar', value: 5000 },
                      { name: 'Abr', value: 4500 },
                      { name: 'May', value: 6000 },
                      { name: 'Jun', value: 5500 },
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#71717a'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#71717a'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#18181b" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
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

                <Card title="Estado de Categorías" className="p-0">
                  <div className="divide-y divide-zinc-100">
                    {[
                      { cat: 'A', label: 'Alta Rotación', color: 'bg-rose-500', pct: 80 },
                      { cat: 'B', label: 'Media Rotación', color: 'bg-amber-500', pct: 15 },
                      { cat: 'C', label: 'Baja Rotación', color: 'bg-zinc-400', pct: 5 },
                    ].map(item => (
                      <div key={item.cat} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Categoría {item.cat}</p>
                            <p className="text-[10px] text-zinc-500">{item.label}</p>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-900">{item.pct}%</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'new':
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
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center space-y-4 hover:border-zinc-400 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Subir Reporte de Stock</p>
                      <p className="text-xs text-zinc-500 mt-1">Formatos soportados: .xlsx, .csv</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Concesionaria</label>
                      <select className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5">
                        <option>Autolux</option>
                        <option>Autosol</option>
                        <option>Ciel</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Sucursal</label>
                      <select className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5">
                        <option>Ax Jujuy</option>
                        <option>Ax Salta</option>
                        <option>Ax Tartagal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Resumen ABC" className="bg-zinc-50 border-zinc-200">
                <div className="space-y-6">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    El sistema aplicará automáticamente la regla 80/15/5 para generar una muestra representativa basada en la valorización del stock.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat A (80%)</span>
                      <span className="font-bold text-zinc-900">80 items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[80%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat B (15%)</span>
                      <span className="font-bold text-zinc-900">15 items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[15%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Muestra Cat C (5%)</span>
                      <span className="font-bold text-zinc-900">5 items</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-zinc-400 h-full w-[5%]" />
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all">
                    Generar Inventario
                  </button>
                </div>
              </Card>
            </div>
          </div>
        );
      case 'audit':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Auditoría en Curso</h2>
                <p className="text-xs text-zinc-500 mt-0.5">ID: INV-20240306-001 • Autolux Jujuy</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                  <Filter className="w-4 h-4 text-zinc-600" />
                </button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por código o descripción..." 
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
                  {inventories[0].articles.map(art => (
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
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-mono text-zinc-400">-</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-xs text-zinc-500">Mostrando {inventories[0].articles.length} artículos de la muestra ABC</p>
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors">
                    Pausar
                  </button>
                  <button className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all">
                    Finalizar Conteo
                  </button>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'justification':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Justificación de Diferencias</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold">8 Discrepancias Críticas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="flex flex-col md:flex-row gap-6 p-0 overflow-hidden">
                  <div className="w-full md:w-64 bg-zinc-50 p-6 border-r border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Artículo</p>
                    <h4 className="text-lg font-bold text-zinc-900">FIL-001</h4>
                    <p className="text-xs text-zinc-500 mt-1">Filtro de Aceite Hilux</p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Sist.</p>
                        <p className="text-sm font-bold text-zinc-900">50</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Físico</p>
                        <p className="text-sm font-bold text-rose-600">48</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Justificación del Depósito</label>
                      <textarea 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 min-h-[100px]"
                        placeholder="Explique el motivo de la diferencia..."
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <select className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none">
                          <option>Ajuste</option>
                          <option>Canje</option>
                          <option>Sin Ajuste</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`val-${i}`} className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                          <label htmlFor={`val-${i}`} className="text-xs font-medium text-zinc-600">Validado por Auditor</label>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors">
                        Confirmar
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      default:
        return <div className="p-12 text-center text-zinc-400">Próximamente...</div>;
    }
  };

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
              DG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">{MOCK_USER.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{MOCK_USER.role}</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium transition-all group">
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
                <p className="text-sm text-zinc-500">Gestione y supervise el estado de sus inventarios rotativos.</p>
              </div>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
