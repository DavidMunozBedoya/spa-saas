"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  Star, 
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import AppointmentDetailsModal from "@/components/dashboard/AppointmentDetailsModal";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  const { hasPermission, loading: permsLoading } = usePermissions();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // ... same logic for dates ...
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      // 1. Fetch Stats (periodo de hoy para "Citas de Hoy" y "Clientes")
      const statsRes = await api.get(`/reports/stats?startDate=${startOfDay}&endDate=${endOfDay}`);
      setStats(statsRes.data);

      // 2. Fetch Citas de hoy (Pendientes)
      const appointmentsRes = await api.get(`/appointments?status=BOOKED&startDate=${startOfDay}&endDate=${endOfDay}`);
      setAppointments(appointmentsRes.data.appointments || []);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Error al cargar datos del panel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (permsLoading) return null;

  const statCards = [
    { 
      label: "Citas de Hoy", 
      value: stats?.totalAppointments || "0", 
      icon: Calendar, 
      change: "Operativas", 
      color: "text-blue-400",
      show: hasPermission("appointments:view")
    },
    { 
      label: "Ingresos (Hoy)", 
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      change: "Calculado", 
      color: "text-emerald-400",
      show: hasPermission("reports:view")
    },
    { 
      label: "Nuevos Clientes", 
      value: stats?.newClients || "0", 
      icon: Users, 
      change: "Hoy", 
      color: "text-purple-400",
      show: hasPermission("reports:view") || hasPermission("clients:view")
    },
  ].filter(card => card.show);

  const hasAppointmentsView = hasPermission("appointments:view");
  const hasEditPermission = hasPermission("appointments:edit");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1 tracking-tight italic">Panel Operativo</h1>
          <p className="text-foreground/40 text-sm font-medium uppercase tracking-[0.2em]">Gestión de Cierre de Caja y Agenda del Día</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">Sistema en Vivo</span>
        </div>
      </div>

      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="glass p-4 rounded-3xl border border-foreground/5 hover:border-foreground/20 transition-all duration-500 group cursor-default relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`p-2 rounded-2xl bg-foreground/5 group-hover:scale-110 group-hover:bg-foreground/10 transition-all duration-300`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30 bg-foreground/5 px-2 py-1 rounded-lg">{stat.change}</span>
              </div>
              <div className="relative z-10">
                <p className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.1em]">{stat.label}</p>
                <h3 className="text-2xl font-black text-foreground mt-0.5 tracking-tighter italic">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasAppointmentsView && (
        <div className="grid grid-cols-1 gap-8">
          <div className="glass p-8 rounded-[2.5rem] border border-foreground/5 min-h-[460px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <Receipt className="text-foreground/5" size={120} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                  <Clock className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Citas Pendientes de Liquidar</h3>
                  <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest">Acceso rápido a facturación</p>
                </div>
              </div>
              
              <button 
                  onClick={() => window.location.href = "/dashboard/appointments"}
                  className="hidden sm:flex items-center gap-3 px-6 py-3 glass rounded-2xl border border-foreground/10 hover:bg-foreground/5 transition-all group"
              >
                  <Calendar size={18} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-foreground">Ver Agenda Completa</span>
                  <ArrowUpRight size={16} className="text-foreground/20 group-hover:text-foreground transition-colors" />
              </button>
            </div>
            
            <div className="flex-1 relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                  <Loader2 className="animate-spin text-primary w-10 h-10" />
                  <p className="text-muted-foreground-auto text-sm font-medium animate-pulse">Sincronizando agenda...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-foreground/2 rounded-3xl border border-dashed border-foreground/10">
                  <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500/20" />
                  </div>
                  <p className="text-foreground/60 font-bold italic">¡Todo al día!</p>
                  <p className="text-foreground/30 text-xs mt-1">No hay citas pendientes de cierre para hoy.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.map((apt) => (
                      <button 
                        key={apt.id}
                        onClick={() => setSelectedAppointmentId(apt.id)}
                        className="flex items-center justify-between p-5 bg-foreground/5 border border-foreground/10 rounded-3xl hover:bg-foreground/10 hover:border-primary/40 transition-all group group-active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs uppercase font-black text-primary/60">{new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div>
                            <p className="font-black text-foreground uppercase tracking-tight leading-tight">{apt.client_name}</p>
                            <p className="text-xs text-foreground/40 font-medium italic">{apt.staff_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Listo</span>
                            <span className="text-[10px] font-bold text-foreground/20">#{apt.id.split('-')[0]}</span>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all shadow-lg group-hover:shadow-emerald-500/20">
                            <ArrowUpRight size={24} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button 
                      onClick={() => window.location.href = "/dashboard/appointments"}
                      className="sm:hidden mt-6 w-full py-4 glass rounded-2xl border border-foreground/10 flex items-center justify-center gap-3"
                  >
                      <Calendar size={18} className="text-primary" />
                      <span className="text-sm font-bold text-foreground">Agenda Completa</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAppointmentId && (
        <AppointmentDetailsModal 
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          canEdit={hasEditPermission}
          onEdit={() => {}} // No editamos desde aquí por ahora, solo liquidar/ver
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
