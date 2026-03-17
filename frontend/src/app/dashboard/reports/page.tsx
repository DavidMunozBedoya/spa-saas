"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2,
  Filter,
  Download,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [staffReport, setStaffReport] = useState<any[]>([]);
  const [serviceReport, setServiceReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(dateRange));
      
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      const [statsRes, staffRes, serviceRes] = await Promise.all([
        api.get(`/reports/stats?startDate=${startStr}&endDate=${endStr}`),
        api.get(`/reports/staff?startDate=${startStr}&endDate=${endStr}`),
        api.get(`/reports/services?startDate=${startStr}&endDate=${endStr}`)
      ]);

      setStats(statsRes.data);
      setStaffReport(staffRes.data);
      setServiceReport(serviceRes.data);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      if (error.response?.status === 403) {
        setIsAuthorized(false);
      } else {
        toast.error("Error al cargar los reportes");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userDataStr = sessionStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const perms = userData.permissions || [];
        setUserPermissions(perms);
        
        if (perms.includes("reports:view") || perms.includes("platform:manage")) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (e) {
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchReports();
    }
  }, [isAuthorized, dateRange]);

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2 italic">Acceso Restringido</h2>
        <p className="text-muted-foreground-auto max-w-md font-medium">
          No tienes los permisos necesarios (`reports:view`) para acceder a las analíticas de este Spa. Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  // --- Gráfica de Barras Horizontal (Staff) ---
  const StaffBarChart = ({ data }: { data: any[] }) => {
    const maxVal = Math.max(...data.map(d => d.total), 1);
    return (
      <div className="space-y-4 pt-4">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1 group">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground-auto group-hover:text-foreground/60 transition-colors">
              <span>{item.name}</span>
              <span>{item.completed} / {item.total} CITAS</span>
            </div>
            <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden border border-foreground/5 p-0.5">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-lg shadow-primary/20"
                style={{ width: `${(item.total / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- Gráfica de Popularidad de Servicios ---
  const ServiceDemandChart = ({ data }: { data: any[] }) => {
    const total = data.reduce((acc, d) => acc + d.count, 0) || 1;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-foreground/5" />
            {data.slice(0, 3).map((item, idx) => {
                let offset = 0;
                for(let i=0; i<idx; i++) offset += (data[i].count / total) * 314;
                return (
                    <circle 
                        key={idx}
                        cx="64" cy="64" r="50" 
                        fill="transparent" 
                        stroke={idx === 0 ? "var(--color-primary)" : idx === 1 ? "#A855F7" : "#3B82F6"} 
                        strokeWidth="12" 
                        strokeDasharray={`${(item.count / total) * 314} 314`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-foreground">{total}</span>
            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">TOTAL</span>
          </div>
        </div>
        <div className="space-y-3 flex flex-col justify-center">
            {data.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", idx === 0 ? "bg-primary" : idx === 1 ? "bg-purple-500" : idx === 2 ? "bg-blue-500" : "bg-foreground/10")} />
                    <span className="text-[10px] font-bold text-foreground/50 truncate uppercase tracking-tight">{item.service}</span>
                    <span className="ml-auto text-[10px] font-black text-foreground">{Math.round((item.count / total) * 100)}%</span>
                </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-4 tracking-tighter italic">
            <TrendingUp className="text-primary w-10 h-10" />
            Análisis de Rendimiento
          </h1>
          <p className="text-muted-foreground-auto text-sm font-medium uppercase tracking-[0.2em] mt-1 pl-1">
            Métricas estratégicas para el crecimiento de tu negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="glass p-1.5 rounded-2xl flex items-center border border-foreground/10">
                {[
                    { id: '7', label: '7D' },
                    { id: '30', label: '30D' },
                    { id: '90', label: '90D' }
                ].map((period) => (
                    <button 
                        key={period.id}
                        onClick={() => setDateRange(period.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black transition-all",
                            dateRange === period.id 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-foreground/40 hover:text-foreground"
                        )}
                    >
                        {period.label}
                    </button>
                ))}
            </div>
            <button className="p-3 glass rounded-2xl border border-foreground/10 text-foreground/40 hover:text-primary transition-all">
                <Download size={20} />
            </button>
        </div>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Ingresos Totales", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Volumen de Citas", value: stats?.totalAppointments || "0", icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Nuevos Clientes", value: stats?.newClients || "0", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((card, idx) => (
          <div key={idx} className="glass group p-8 rounded-[2.5rem] border border-foreground/5 hover:border-primary/20 transition-all duration-500 relative overflow-hidden">
             <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10 transition-transform group-hover:scale-110", card.bg)} />
             <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl border border-foreground/10", card.bg)}>
                    <card.icon className={card.color} size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400">
                    <ArrowUpRight size={14} />
                    <span>Calculado</span>
                </div>
             </div>
             <p className="text-foreground/30 text-[11px] font-black uppercase tracking-[0.2em]">{card.label}</p>
             <h3 className="text-4xl font-black text-foreground mt-2 tracking-tighter italic">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Staff Performance */}
        <div className="glass p-8 rounded-[3rem] border border-foreground/5 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                        <Users className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Rendimiento del Personal</h3>
                        <p className="text-muted-foreground-auto text-[10px] font-black uppercase tracking-widest mt-0.5">Ranking por citas atendidas</p>
                    </div>
                </div>
             </div>
             
             {isLoading ? (
                 <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                 </div>
             ) : staffReport.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
                    <p className="text-foreground/30 font-bold italic uppercase tracking-widest text-xs">Sin datos para este periodo</p>
                 </div>
             ) : (
                 <StaffBarChart data={staffReport} />
             )}
        </div>

        {/* Popular Services */}
        <div className="glass p-8 rounded-[3rem] border border-foreground/5 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Briefcase className="text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Demanda de Servicios</h3>
                        <p className="text-muted-foreground-auto text-[10px] font-black uppercase tracking-widest mt-0.5">Mix comercial de tratamientos</p>
                    </div>
                </div>
             </div>

             {isLoading ? (
                 <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                 </div>
             ) : serviceReport.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-foreground/[0.02] rounded-3xl border border-dashed border-foreground/10">
                    <p className="text-foreground/30 font-bold italic uppercase tracking-widest text-xs">Sin datos para este periodo</p>
                 </div>
             ) : (
                 <ServiceDemandChart data={serviceReport} />
             )}
        </div>

      </div>
    </div>
  );
}
