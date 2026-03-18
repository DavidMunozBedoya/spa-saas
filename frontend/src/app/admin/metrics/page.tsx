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
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GlobalMetrics {
  totalSpas: number;
  totalUsers: number;
  totalAppointments: number;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    totalSpas: 0,
    totalUsers: 0,
    totalAppointments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/platform/stats");
      setMetrics(res.data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Error al cargar las métricas globales");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresco automático de métricas cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      title: "Spas Registrados",
      value: metrics.totalSpas,
      icon: <Building2 className="text-blue-500" size={24} />,
      color: "bg-blue-500/10 border-blue-500/20",
      /* trend: "+12% este mes" */
    },
    {
      title: "Usuarios Totales",
      value: metrics.totalUsers,
      icon: <Users className="text-emerald-500" size={24} />,
      color: "bg-emerald-500/10 border-emerald-500/20",
     /*  trend: "+24% este mes" */
    },
    {
      title: "Citas Procesadas",
      value: metrics.totalAppointments,
      icon: <CalendarCheck className="text-purple-500" size={24} />,
      color: "bg-purple-500/10 border-purple-500/20",
      /* trend: "+8% esta semana" */
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 italic">
            <Activity className="text-primary" size={32} />
            Métricas Globales
          </h1>
          <p className="text-foreground/60 mt-2">Visión integral del rendimiento de la plataforma SaaS.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card, idx) => (
          <div 
            key={idx} 
            className="glass rounded-3xl p-6 border border-foreground/10 hover:border-foreground/20 transition-all group relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] transition-all group-hover:blur-[60px]",
              card.color.split(' ')[0]
            )} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border backdrop-blur-md",
                card.color
              )}>
                {card.icon}
              </div>
              <div className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/5 text-xs text-foreground/40 font-bold flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" /> Live
              </div>
            </div>
            
            <p className="text-foreground/60 text-sm font-bold tracking-wide uppercase">{card.title}</p>
            
            <div className="mt-2 flex items-baseline gap-3">
              <h2 className="text-5xl font-black text-foreground drop-shadow-sm">
                {isLoading ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/20 to-white/5 animate-pulse">
                    ---
                  </span>
                ) : (
                  card.value.toLocaleString()
                )}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
