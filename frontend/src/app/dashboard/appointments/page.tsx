"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Scissors
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import NewAppointmentModal from "@/components/dashboard/NewAppointmentModal";
import AppointmentDetailsModal from "@/components/dashboard/AppointmentDetailsModal";
import AvailabilityTimeline from "@/components/dashboard/AvailabilityTimeline";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ total: 0, limit: 20, offset: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [timelineSelection, setTimelineSelection] = useState<{staffId: string, startTime: string} | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("BOOKED");
  const [datePeriod, setDatePeriod] = useState<string>("TODAY"); // TODAY, WEEK, MONTH, CUSTOM
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const { hasPermission } = usePermissions();
  const hasCreatePermission = hasPermission("appointments:create");
  const hasEditPermission = hasPermission("appointments:edit");

  const fetchStaff = async () => {
    try {
        const response = await api.get("/staff");
        setStaff(response.data.filter((s: any) => s.active));
    } catch (error) {
        console.error("Error fetching staff:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      let startDate = "";
      let endDate = "";
      
      const today = new Date();
      if (datePeriod === "TODAY") {
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
      } else if (datePeriod === "WEEK") {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      } else if (datePeriod === "MONTH") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (datePeriod === "CUSTOM") {
        startDate = customRange.start;
        endDate = customRange.end;
      }

      let params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", currentPage.toString());
      params.append("limit", "20");

      const url = `/appointments?${params.toString()}`;
        
      const response = await api.get(url);
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (error: any) {
      toast.error("Error al cargar las citas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAppointments();
  }, [statusFilter, datePeriod, customRange, currentPage]);

  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <PermissionGuard permission="appointments:view">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 sm:px-4">
        
        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight italic">
              <CalendarIcon className="text-primary" size={32} />
              Agenda de Citas
            </h1>
            <p className="text-muted-foreground-auto mt-1 font-medium uppercase text-[10px] tracking-widest">
              Gestiona las reservas y el tiempo de tus servicios
            </p>
          </div>
          
            <div className="flex items-center gap-3">
              {hasCreatePermission && (
                <button 
                  onClick={() => {
                    setEditingAppointment(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Plus size={20} />
                  Nueva Cita
                </button>
              )}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-6">
              <div className="glass rounded-3xl p-6 border border-foreground/10 sticky top-6 shadow-2xl shadow-black/5">
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-4 italic">Filtros Inteligentes</h3>
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Periodo</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[
                                  { id: 'TODAY', label: 'Hoy' },
                                  { id: 'WEEK', label: 'Semana' },
                                  { id: 'MONTH', label: 'Este Mes' },
                                  { id: 'CUSTOM', label: 'Por Fechas' }
                              ].map((p) => (
                                  <button
                                      key={p.id}
                                      onClick={() => {
                                          setDatePeriod(p.id);
                                          setCurrentPage(1);
                                      }}
                                      className={cn(
                                          "px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                          datePeriod === p.id 
                                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" 
                                              : "glass border-foreground/10 text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                                      )}
                                  >
                                      {p.label}
                                  </button>
                              ))}
                          </div>
                      </div>
  
                      {datePeriod === 'CUSTOM' && (
                          <div className="space-y-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-foreground/20 uppercase tracking-widest pl-1">Desde</label>
                                  <input 
                                      type="date" 
                                      value={customRange.start}
                                      onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg p-2 text-[10px] text-foreground focus:border-primary/50"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-foreground/20 uppercase tracking-widest pl-1">Hasta</label>
                                  <input 
                                      type="date" 
                                      value={customRange.end}
                                      onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg p-2 text-[10px] text-foreground focus:border-primary/50"
                                  />
                              </div>
                          </div>
                      )}
  
                      <div className="space-y-2 pt-4 border-t border-foreground/5">
                          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Estado</label>
                          <div className="grid grid-cols-1 gap-2">
                              {[
                                  { id: 'BOOKED', label: 'Pendientes', color: 'bg-blue-500' },
                                  { id: 'COMPLETED', label: 'Completadas', color: 'bg-emerald-500' },
                                  { id: 'CANCELLED', label: 'Canceladas', color: 'bg-red-500' },
                                  { id: 'ALL', label: 'Ver Todas', color: 'bg-foreground' }
                              ].map((filter) => (
                                  <button
                                      key={filter.id}
                                      onClick={() => {
                                          setStatusFilter(filter.id);
                                          setCurrentPage(1);
                                      }}
                                      className={cn(
                                          "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
                                          statusFilter === filter.id 
                                              ? "bg-foreground/10 border-foreground/20 text-foreground shadow-lg shadow-black/5" 
                                              : "border-transparent text-foreground/40 hover:bg-foreground/5 hover:text-foreground/60"
                                      )}
                                  >
                                      <div className={cn("w-2 h-2 rounded-full", filter.color)} />
                                      {filter.label}
                                  </button>
                              ))}
                          </div>
                      </div>
  
                      <div className="pt-4 border-t border-foreground/5">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                              <input 
                                  type="text" 
                                  placeholder="Buscar cliente..."
                                  className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-xl focus:border-primary/50 text-[10px] text-foreground placeholder:text-foreground/30 font-bold uppercase tracking-widest"
                              />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
  
          {/* Appointments Feed */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Availability Timeline (Show only for Today/Selected Day) */}
            {(datePeriod === 'TODAY' || (datePeriod === 'CUSTOM' && customRange.start)) && (
              <AvailabilityTimeline 
                  staff={staff}
                  appointments={appointments}
                  selectedDate={datePeriod === 'TODAY' ? new Date().toLocaleDateString('sv-SE') : customRange.start}
                  onSelectSlot={(staffId, startTime) => {
                      setEditingAppointment(null);
                      setTimelineSelection({ staffId, startTime });
                      setIsModalOpen(true);
                  }}
                  hasCreatePermission={hasCreatePermission}
              />
            )}
  
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div className="glass rounded-3xl p-12 border border-foreground/10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mb-4 border border-foreground/5">
                  <CalendarIcon className="text-foreground/30 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 uppercase tracking-tight italic">No hay registros</h3>
                <p className="text-foreground/50 max-w-md text-xs font-medium uppercase tracking-widest opacity-80">
                  No encontramos citas con los filtros aplicados en este periodo. Intenta cambiar el rango de fechas o el estado.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {sortedAppointments.map((apt) => (
                    <div 
                        key={apt.id}
                        onClick={() => setSelectedAppointmentId(apt.id)}
                        className="glass group hover:bg-foreground/5 transition-all p-4 rounded-[1.5rem] border border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer active:scale-[0.99] animate-in slide-in-from-right-2 duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all">
                                <span className="text-[10px] uppercase font-black text-primary/60 leading-none group-hover:text-primary-foreground/60 tracking-tighter">
                                    {new Date(apt.start_time).toLocaleDateString('es-ES', { month: 'short' })}
                                </span>
                                <span className="text-lg font-black text-foreground leading-tight group-hover:text-primary-foreground tracking-tighter">
                                    {new Date(apt.start_time).getDate()}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-foreground leading-none tracking-tight">{apt.client_name}</h4>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-sm",
                                        apt.status === 'BOOKED' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                        apt.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
                                        <Clock size={12} className="text-primary/40 group-hover:text-primary transition-colors" />
                                        {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
                                        <Scissors size={12} className="text-primary/40 group-hover:text-primary transition-colors" />
                                        {apt.staff_name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hidden sm:flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">Detalles</span>
                            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Ver Ficha</span>
                        </div>
                    </div>
                  ))}
                </div>
  
                 {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-6 px-2">
                  <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                    Mostrando {appointments.length} de {pagination.total} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-2 rounded-xl glass border-foreground/10 text-foreground disabled:opacity-20 hover:bg-foreground/10 transition-all active:scale-90"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-1 px-4 py-2 glass rounded-xl border-foreground/10">
                      <span className="text-xs font-black text-primary">{currentPage}</span>
                      <span className="text-xs font-bold text-foreground/20">/</span>
                      <span className="text-xs font-bold text-foreground/40">{Math.ceil(pagination.total / pagination.limit) || 1}</span>
                    </div>
                    <button 
                      disabled={currentPage * pagination.limit >= pagination.total}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 rounded-xl glass border-foreground/10 text-foreground disabled:opacity-20 hover:bg-foreground/10 transition-all active:scale-90"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
  
        {isModalOpen && (
          <NewAppointmentModal 
            appointmentToEdit={editingAppointment}
            isEditMode={!!editingAppointment}
            initialStaffId={timelineSelection?.staffId}
            initialStartTime={timelineSelection?.startTime}
            onClose={() => {
              setIsModalOpen(false);
              setEditingAppointment(null);
              setTimelineSelection(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingAppointment(null);
              setTimelineSelection(null);
              fetchAppointments();
            }}
          />
        )}
  
        {selectedAppointmentId && (
          <AppointmentDetailsModal 
            appointmentId={selectedAppointmentId}
            onClose={() => setSelectedAppointmentId(null)}
            canEdit={hasEditPermission}
            onEdit={(apt) => {
              setEditingAppointment(apt);
              setSelectedAppointmentId(null);
              setIsModalOpen(true);
            }}
            onSuccess={() => {
              fetchAppointments();
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
