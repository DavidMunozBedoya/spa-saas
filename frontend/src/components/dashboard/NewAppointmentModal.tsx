"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  UserPlus,
  Sparkles,
  ChevronDown,
  Save,
  Archive,
  RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const appointmentSchema = z.object({
  client_identity: z.string().min(5, "La identificación debe tener al menos 5 caracteres"),
  client_name: z.string().min(3, "El nombre es obligatorio").optional().or(z.literal("")),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  client_phone: z.string().optional().or(z.literal("")),
  client_birth_date: z.string().optional().or(z.literal("")),
  staff_id: z.string().min(1, "Debe seleccionar un especialista"),
  service_ids: z.array(z.string()).min(1, "Debe seleccionar al menos un servicio"),
  start_time: z.string().min(1, "Debe seleccionar fecha y hora"),
  end_time: z.string().min(1, "Hora de finalización requerida"),
  client_id: z.string().uuid().nullable().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface NewAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  isEditMode?: boolean;
  appointmentToEdit?: any;
  initialStaffId?: string;
  initialStartTime?: string;
}

export default function NewAppointmentModal({ 
  onClose, 
  onSuccess, 
  isEditMode = false, 
  appointmentToEdit,
  initialStaffId,
  initialStartTime
}: NewAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [clientFound, setClientFound] = useState<any>(null);
  const [showNewClientFields, setShowNewClientFields] = useState(false);
  const [archivedClient, setArchivedClient] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_identity: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      client_birth_date: "",
      staff_id: "",
      service_ids: [],
      start_time: "",
      end_time: "",
      client_id: null,
    }
  });

  const watchIdentity = watch("client_identity");
  const watchDate = watch("start_time");

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, servicesRes] = await Promise.all([
          api.get("/staff/therapists"),
          api.get("/services")
        ]);
        setStaffList(staffRes.data.filter((s: any) => s.active));
        setServicesList(servicesRes.data.filter((s: any) => s.active));

        if (isEditMode && appointmentToEdit) {
            // Cargar datos existentes en modo edición
            setValue("staff_id", appointmentToEdit.staff_id);
            const sIds = appointmentToEdit.services.map((s: any) => s.id);
            setSelectedServices(sIds);
            setValue("service_ids", sIds);
            
            // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
            const startDate = new Date(appointmentToEdit.start_time);
            const offset = startDate.getTimezoneOffset() * 60000;
            const localStart = new Date(startDate.getTime() - offset).toISOString().slice(0, 16);
            setValue("start_time", localStart);
            
            // Identificar al cliente (solo visual, no se edita en este flujo)
            setClientFound({
                id: appointmentToEdit.client_id,
                full_name: appointmentToEdit.client_name,
                identity_number: appointmentToEdit.identity_number,
                email: appointmentToEdit.client_email
            });
            setValue("client_id", appointmentToEdit.client_id);
            setValue("client_identity", appointmentToEdit.identity_number);
        }
        if (initialStaffId) {
            setValue("staff_id", initialStaffId);
        }
        if (initialStartTime) {
            setValue("start_time", initialStartTime);
        }
      } catch (error) {
        console.error("Error fetching modal data:", error);
        toast.error("Error al cargar la lista de personal o servicios");
      }
    };
    fetchData();
  }, [isEditMode, appointmentToEdit, setValue, initialStaffId, initialStartTime]);

  // --- Auto-Search Client Logic ---
  useEffect(() => {
    if (isEditMode) return;
    
    if (!watchIdentity || watchIdentity.length < 5) {
        setClientFound(null);
        setArchivedClient(null);
        setShowNewClientFields(false);
        setValue("client_id", null);
        return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        try {
            const response = await api.get(`/clients/search?identity=${watchIdentity}`);
            
            if (response.data) {
                // Si el cliente está archivado, mostrar opción de restaurar
                if (response.data.status === "archived") {
                    setArchivedClient(response.data);
                    setClientFound(null);
                    setShowNewClientFields(false);
                    setValue("client_id", null);
                } else {
                    setClientFound(response.data);
                    setArchivedClient(null);
                    setValue("client_id", response.data.id);
                    setValue("client_identity", response.data.identity_number);
                    setShowNewClientFields(false);
                    clearErrors("client_identity");
                }
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setClientFound(null);
                setArchivedClient(null);
                setValue("client_id", null);
                setShowNewClientFields(true);
            }
        } finally {
            setIsSearching(false);
        }
    }, 800);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [watchIdentity, setValue, clearErrors]);

  // --- Restaurar cliente archivado ---
  const handleRestoreClient = async () => {
    if (!archivedClient) return;
    try {
      await api.patch(`/clients/${archivedClient.id}/restore`);
      toast.success(`${archivedClient.full_name} restaurado exitosamente`);
      // Ahora seleccionamos al cliente restaurado
      setClientFound({ ...archivedClient, active: true });
      setArchivedClient(null);
      setValue("client_id", archivedClient.id);
      setValue("client_identity", archivedClient.identity_number);
      clearErrors("client_identity");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al restaurar el cliente");
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
        const isSelected = prev.includes(serviceId);
        const next = isSelected 
            ? prev.filter(id => id !== serviceId)
            : [...prev, serviceId];
        
        setValue("service_ids", next, { shouldValidate: true });
        return next;
    });
  };

  // --- Auto-calculate end_time Effect ---
  useEffect(() => {
    if (watchDate && selectedServices.length > 0) {
        const totalDuration = servicesList
            .filter(s => selectedServices.includes(s.id))
            .reduce((acc, s) => acc + Number(s.duration_minutes), 0);
            
        if (totalDuration > 0) {
            const start = new Date(watchDate);
            const end = new Date(start.getTime() + totalDuration * 60000);
            
            const year = end.getFullYear();
            const month = String(end.getMonth() + 1).padStart(2, '0');
            const day = String(end.getDate()).padStart(2, '0');
            const hours = String(end.getHours()).padStart(2, '0');
            const minutes = String(end.getMinutes()).padStart(2, '0');
            
            setValue("end_time", `${year}-${month}-${day}T${hours}:${minutes}`, { shouldValidate: true });
        } else {
            setValue("end_time", "", { shouldValidate: true });
        }
    } else {
        setValue("end_time", "", { shouldValidate: true });
    }
  }, [watchDate, selectedServices, servicesList, setValue]);

  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    toast.error("Existen errores en el formulario. Por favor, revise los campos marcados en rojo.");
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsLoading(true);
    try {
      
      // Convert times to full ISO
      const isoStart = new Date(data.start_time).toISOString();
      const isoEnd = new Date(data.end_time).toISOString();

      let payload: any;
      
      if (isEditMode) {
          // Payload minimalista para actualización (según UpdateAppointmentSchema del backend)
          payload = {
              staff_id: data.staff_id,
              service_ids: data.service_ids,
              start_time: isoStart,
              end_time: isoEnd,
              timezone_offset: -new Date().getTimezoneOffset()
          };
      } else {
          // Payload para creación
          payload = { 
              ...data,
              start_time: isoStart,
              end_time: isoEnd,
              timezone_offset: -new Date().getTimezoneOffset()
          };

          // Limpieza de campos opcionales del cliente
          if (!payload.client_email || payload.client_email === "") payload.client_email = null;
          if (!payload.client_phone || payload.client_phone === "") payload.client_phone = null;
          if (!payload.client_birth_date || payload.client_birth_date === "") payload.client_birth_date = null;
          
          if (clientFound) {
              delete payload.client_name;
              delete payload.client_email;
              delete payload.client_phone;
              delete payload.client_birth_date;
          }
      }

      if (isEditMode) {
        await api.put(`/appointments/${appointmentToEdit.id}`, payload);
        toast.success("Cita actualizada exitosamente");
      } else {
        await api.post("/appointments", payload);
        toast.success("Cita agendada correctamente");
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || "Error al procesar la cita";
      toast.error(typeof message === "string" ? message : "Verifica los datos del formulario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-foreground/10 rounded-[2.5rem] w-full max-w-5xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-foreground/5 flex items-center justify-between relative z-10 shrink-0 bg-foreground/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <Calendar className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">
                {isEditMode ? "Editar Reserva" : "Reserva Premium"}
              </h2>
              <p className="text-xs text-foreground/40 font-medium flex items-center gap-1.5 uppercase tracking-widest">
                <Sparkles size={12} className="text-primary" />
                {isEditMode ? "Ajusta los detalles de tu servicio" : "Nueva Experiencia de Bienestar"}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-3 text-foreground/30 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all border border-transparent hover:border-foreground/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col flex-1 overflow-hidden relative z-10">
          <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
            {/* Hidden fields for calculated values */}
            <input type="hidden" {...register("end_time")} />
            <input type="hidden" {...register("service_ids")} />
            <input type="hidden" {...register("client_id")} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* LEFT COLUMN: Client & Schedule (7 cols) */}
              <div className="lg:col-span-7 space-y-10">
                
                {/* --- SECTION: CLIENT --- */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center border border-foreground/10">
                        <User size={16} className="text-primary/60" />
                     </div>
                     <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.2em]">Identificación del Cliente <span className="text-red-500">*</span></h3>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                      {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </div>
                    <input 
                      {...register("client_identity", {
                        onChange: (e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setValue("client_identity", val, { shouldValidate: true });
                        }
                      })}
                      placeholder="Ingrese identificación (solo números)"
                      autoComplete="off"
                      disabled={isEditMode}
                      maxLength={15}
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                      className={cn(
                          "w-full pl-12 pr-4 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-base text-foreground transition-all placeholder:text-foreground/40",
                          errors.client_identity ? "border-red-500/40 bg-red-500/5" : "",
                          isEditMode && "opacity-60 cursor-not-allowed bg-foreground/10"
                      )}
                      onFocus={(e) => !errors.client_identity && (e.target.style.borderColor = 'var(--input-focus-border)')}
                      onBlur={(e) => !errors.client_identity && (e.target.style.borderColor = 'var(--input-border)')}
                    />
                    {clientFound && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 animate-in fade-in zoom-in">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Registrado</span>
                        </div>
                    )}
                  </div>
                  {errors.client_identity && <p className="text-xs text-red-500 pl-4">{errors.client_identity.message}</p>}

                  {/* --- Found / New Client Content --- */}
                  <div className="relative">
                    {archivedClient ? (
                      <div className="p-5 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl italic shadow-lg border border-amber-500/30">
                                  <Archive size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-lg font-black text-foreground truncate leading-tight uppercase tracking-tight">{archivedClient.full_name}</p>
                                  <p className="text-xs text-amber-500 font-bold flex items-center gap-2 mt-1">
                                      <Archive size={12} />
                                      Cliente Archivado
                                  </p>
                              </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRestoreClient}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
                          >
                            <RefreshCcw size={14} />
                            Restaurar y Seleccionar
                          </button>
                      </div>
                    ) : clientFound ? (
                      <div className="p-5 rounded-[1.5rem] border border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-xl italic shadow-lg border border-primary/30">
                                  {clientFound.full_name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-lg font-black text-foreground truncate leading-tight uppercase tracking-tight">{clientFound.full_name}</p>
                                  <p className="text-xs text-foreground/40 font-medium flex items-center gap-2 mt-1">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                      Cliente Frecuente
                                  </p>
                              </div>
                          </div>
                      </div>
                    ) : showNewClientFields ? (
                      <div className="space-y-4 animate-in slide-in-from-top-6 duration-500">
                        <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-2">
                           <UserPlus size={18} className="text-amber-500" />
                           <div>
                              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Nuevo Registro</p>
                              <p className="text-[10px] text-foreground/40 font-medium">El cliente no existe, complete los datos para crearlo automáticamente.</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Nombre Completo *</label>
                            <input 
                              {...register("client_name")}
                              placeholder="Ej. Isabella Martínez"
                              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                              className={cn(
                                  "w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-1 text-sm text-foreground transition-all shadow-inner",
                                  errors.client_name ? "border-red-500/40 bg-red-500/5" : ""
                              )}
                              onFocus={(e) => !errors.client_name && (e.target.style.borderColor = 'var(--input-focus-border)')}
                              onBlur={(e) => !errors.client_name && (e.target.style.borderColor = 'var(--input-border)')}
                            />
                            {errors.client_name && <p className="text-[10px] text-red-500 pl-2">{errors.client_name.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Teléfono (Opcional)</label>
                            <input 
                              {...register("client_phone")}
                              placeholder="+57 300 000 0000"
                              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                              className={cn(
                                  "w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-1 text-sm text-foreground shadow-inner transition-all",
                                  errors.client_phone ? "border-red-500/40 bg-red-500/5" : ""
                              )}
                              onFocus={(e) => !errors.client_phone && (e.target.style.borderColor = 'var(--input-focus-border)')}
                              onBlur={(e) => !errors.client_phone && (e.target.style.borderColor = 'var(--input-border)')}
                            />
                            {errors.client_phone && <p className="text-[10px] text-red-500 pl-2">{errors.client_phone.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Email (Opcional)</label>
                            <input 
                              {...register("client_email")}
                              type="email"
                              placeholder="cliente@ejemplo.com"
                              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                              className={cn(
                                  "w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-1 text-sm text-foreground shadow-inner transition-all",
                                  errors.client_email ? "border-red-500/40 bg-red-500/5" : ""
                              )}
                              onFocus={(e) => !errors.client_email && (e.target.style.borderColor = 'var(--input-focus-border)')}
                              onBlur={(e) => !errors.client_email && (e.target.style.borderColor = 'var(--input-border)')}
                            />
                            {errors.client_email && <p className="text-[10px] text-red-500 pl-2">{errors.client_email.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Fecha de Nacimiento (Opcional)</label>
                            <input 
                              {...register("client_birth_date")}
                              type="date"
                              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                              className={cn(
                                  "w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-1 text-sm text-foreground shadow-inner transition-all",
                                  errors.client_birth_date ? "border-red-500/40 bg-red-500/5" : ""
                              )}
                              onFocus={(e) => !errors.client_birth_date && (e.target.style.borderColor = 'var(--input-focus-border)')}
                              onBlur={(e) => !errors.client_birth_date && (e.target.style.borderColor = 'var(--input-border)')}
                            />
                            {errors.client_birth_date && <p className="text-[10px] text-red-500 pl-2">{errors.client_birth_date.message}</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-foreground/5 rounded-[2rem]">
                          <p className="text-xs text-foreground/20 font-medium uppercase tracking-[0.2em]">Esperando identificación...</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* --- SECTION: SCHEDULE & STAFF --- */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center border border-foreground/10">
                        <Clock size={16} className="text-primary/60" />
                     </div>
                     <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.2em]">Agenda y Especialista</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 group relative">
                        <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Especialista Requerido *</label>
                        <div className="relative">
                          <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
                          <select 
                              {...register("staff_id")}
                              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                              className={cn(
                                  "w-full pl-12 pr-10 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground appearance-none transition-all shadow-inner cursor-pointer",
                                  errors.staff_id ? "border-red-500/40 bg-red-500/5" : ""
                              )}
                              onFocus={(e) => !errors.staff_id && (e.target.style.borderColor = 'var(--input-focus-border)')}
                              onBlur={(e) => !errors.staff_id && (e.target.style.borderColor = 'var(--input-border)')}
                          >
                              <option value="" className="bg-background">Seleccionar Especialista...</option>
                              {staffList.map(s => (
                                  <option key={s.id} value={s.id} className="bg-background text-foreground">
                                      {s.full_name}
                                  </option>
                              ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/30 group-hover:text-primary transition-colors">
                              <ChevronDown size={18} />
                          </div>
                        </div>
                        {errors.staff_id && <p className="text-[10px] text-red-500 pl-4">{errors.staff_id.message}</p>}
                        {staffList.length === 0 && <p className="text-[10px] text-amber-500/60 pl-4 italic">No se encontraron especialistas activos</p>}
                      </div>

                      <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Fecha y Hora de Inicio *</label>
                          <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
                              <input 
                                  {...register("start_time")}
                                  type="datetime-local"
                                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                                  className={cn(
                                      "w-full pl-12 pr-4 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-xs text-foreground transition-all shadow-inner",
                                      errors.start_time ? "border-red-500/40 bg-red-500/5" : ""
                                  )}
                                  onFocus={(e) => !errors.start_time && (e.target.style.borderColor = 'var(--input-focus-border)')}
                                  onBlur={(e) => !errors.start_time && (e.target.style.borderColor = 'var(--input-border)')}
                              />
                          </div>
                          {errors.start_time && <p className="text-[10px] text-red-500 pl-4">{errors.start_time.message}</p>}
                      </div>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Services (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-8">
                 <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center border border-foreground/10">
                              <Sparkles size={16} className="text-primary/60" />
                          </div>
                          <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.2em]">Nuestros Servicios</h3>
                      </div>
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                          {selectedServices.length} {selectedServices.length === 1 ? 'Seleccionado' : 'Seleccionados'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[450px] lg:max-h-[500px] overflow-y-auto pr-3 custom-scrollbar min-h-[100px]">
                        {servicesList.length === 0 ? (
                            <div className="text-center py-10 border border-foreground/5 rounded-3xl bg-foreground/5">
                               <Scissors size={24} className="text-foreground/10 mx-auto mb-2" />
                               <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest">No hay servicios disponibles</p>
                            </div>
                        ) : (
                            servicesList.map(s => {
                              const isSelected = selectedServices.includes(s.id);
                              return (
                                  <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleService(s.id)}
                                      className={cn(
                                          "text-left p-4 rounded-[1.5rem] border transition-all flex items-center justify-between group/card relative overflow-hidden",
                                          isSelected 
                                              ? "bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]" 
                                              : "bg-foreground/5 border-foreground/5 hover:border-foreground/10"
                                      )}
                                  >
                                      {isSelected && (
                                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                                      )}
                                      <div className="flex-1 min-w-0 relative z-10">
                                          <p className={cn("text-sm font-black truncate uppercase tracking-tighter", isSelected ? "text-primary-foreground" : "text-foreground/70")}>
                                              {s.name}
                                          </p>
                                          <div className="flex items-center gap-3 mt-2">
                                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-foreground/10 rounded-md text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                                                  <Clock size={10} className="text-primary/60" />
                                                  {s.duration_minutes} min
                                              </div>
                                              <div className="text-xs font-black text-primary italic">
                                                  ${s.price}
                                              </div>
                                          </div>
                                      </div>
                                      <div className={cn(
                                          "w-6 h-6 rounded-xl border flex items-center justify-center transition-all relative z-10",
                                          isSelected ? "bg-primary border-primary shadow-lg" : "bg-foreground/5 border-foreground/10 group-hover/card:border-foreground/20"
                                      )}>
                                          {isSelected && <CheckCircle2 size={14} className="text-primary-foreground" />}
                                      </div>
                                  </button>
                              );
                          })
                        )}
                    </div>
                    {errors.service_ids && <p className="text-[10px] text-red-500 pl-4 flex items-center gap-1"><AlertCircle size={10} /> {errors.service_ids.message}</p>}
                 </div>

                  {/* --- FOOTER SUMMARY --- */}
                  {selectedServices.length > 0 && (
                      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] space-y-3 animate-in slide-in-from-right-10 duration-500 shadow-xl shadow-foreground/5 relative overflow-hidden">
                          <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full" />
                          <div className="flex justify-between items-end relative z-10">
                              <div>
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Inversión Estimada</p>
                                  <p className="text-3xl font-black text-foreground italic leading-none">
                                  ${servicesList.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.price), 0).toFixed(0)}
                                  </p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-bold text-foreground/40 uppercase leading-none mb-1">Cierre Estimado</p>
                                  <p className="text-xs font-black text-foreground/80">
                                      {watchDate && selectedServices.length > 0 ? (
                                          (() => {
                                              const totalDuration = servicesList
                                                  .filter(s => selectedServices.includes(s.id))
                                                  .reduce((acc, s) => acc + Number(s.duration_minutes), 0);
                                              const start = new Date(watchDate);
                                              const end = new Date(start.getTime() + totalDuration * 60000);
                                              return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                          })()
                                      ) : '--:--'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-foreground/5 shrink-0 flex flex-col sm:flex-row gap-4 border-t border-foreground/10">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-[1.25rem] border border-foreground/10 transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-[2] py-4 bg-primary text-primary-foreground font-black rounded-[1.25rem] shadow-[0_10px_30px_-10px_rgba(var(--color-primary),0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isEditMode ? <Save size={20} className="group-hover:scale-110 transition-transform" /> : <CheckCircle2 size={20} />}
                    {isEditMode ? "GUARDAR CAMBIOS" : "CONFIRMAR RESERVA"}
                  </>
                )}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
