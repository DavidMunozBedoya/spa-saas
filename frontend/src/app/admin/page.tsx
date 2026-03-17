"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Building2, 
  Users, 
  CalendarCheck, 
  TrendingUp,
  Activity,
  ArrowUpRight,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GlobalStats {
  totalSpas: number;
  totalUsers: number;
  totalAppointments: number;
}

interface Spa {
  id: string;
  name: string;
  spa_email: string;
  active: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recentSpas, setRecentSpas] = useState<Spa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ status: string; time: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      
      try {
        const [statsRes, spasRes, dbRes] = await Promise.all([
          api.get("/platform/stats"),
          api.get("/platform/spas"),
          api.get("/testing/db-status").catch(() => null)
        ]);
        
        setStats(statsRes.data);
        // Mostrar los últimos 3
        setRecentSpas(spasRes.data.slice(0, 3));
        if (dbRes) setDbStatus(dbRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Error al cargar datos reales del servidor");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = [
    { label: "Total Spas", value: stats?.totalSpas || 0, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Usuarios", value: stats?.totalUsers || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Estado", value: "Saludable", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight italic">Platform Overview</h1>
          <p className="text-foreground/50 mt-1">Monitoreo global de la red de Spas y métricas de uso.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar Spa..." 
              className="pl-10 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-64 text-sm text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="glass p-6 rounded-3xl border border-foreground/10 hover:border-foreground/20 transition-all group cursor-default">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                <kpi.icon size={24} />
              </div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <Activity size={12} />
                Live
              </span>
            </div>
            <div>
              <p className="text-foreground/50 text-sm font-medium uppercase tracking-[0.1em]">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tighter italic">
                {isLoading ? "..." : kpi.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-foreground/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={24} />
              <h2 className="text-xl font-bold text-foreground tracking-tight">Actividad de la Red</h2>
            </div>
          </div>
          
          <div className="space-y-6">
            {recentSpas.length > 0 ? (
              recentSpas.map((spa) => (
                <div key={spa.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-foreground/5 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                    {spa.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium group-hover:text-primary transition-colors">Nuevo Spa Registrado: "{spa.name}"</p>
                    <p className="text-foreground/40 text-xs mt-1">
                      Registrado: {new Date(spa.created_at).toLocaleDateString()} • {spa.spa_email}
                    </p>
                  </div>
                  <div className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full",
                    spa.active ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                  )}>
                    {spa.active ? "Activo" : "Inactivo"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-foreground/20 py-10">No hay actividad reciente.</p>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-foreground/10">
          <h2 className="text-xl font-bold text-foreground mb-6 tracking-tight">Salud del Sistema</h2>
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
              <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-1">Base de Datos</p>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", dbStatus?.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                <span className="text-xs text-foreground font-medium">
                  {dbStatus?.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {dbStatus?.time && (
                <p className="text-[10px] text-foreground/20 mt-1">Server Time: {new Date(dbStatus.time).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
