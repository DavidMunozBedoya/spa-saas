"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { 
  X, 
  User, 
  Loader2, 
  CheckCircle2, 
  Save,
  Sparkles,
  Contact
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const clientSchema = z.object({
  full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
  identity_number: z.string().min(5, "Mínimo 5 dígitos").max(50).regex(/^\d+$/, "Solo números").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(7, "Mínimo 7 dígitos").max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function ClientFormModal({ 
  onClose, 
  onSuccess, 
  editData 
}: ClientFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!editData;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: editData?.full_name || "",
      identity_number: editData?.identity_number || "",
      email: editData?.email || "",
      phone: editData?.phone || "",
      birth_date: editData?.birth_date ? editData.birth_date.split('T')[0] : "",
    }
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsLoading(true);
    try {
      const payload: any = { ...data };

      // Clean optional empty fields
      if (!payload.identity_number) payload.identity_number = null;
      if (!payload.email) payload.email = null;
      if (!payload.phone) payload.phone = null;
      if (!payload.birth_date) payload.birth_date = null;

      if (isEditMode) {
        await api.patch(`/clients/${editData.id}`, payload);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await api.post("/clients", payload);
        toast.success("Cliente registrado exitosamente");
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || "Error al procesar el cliente";
      toast.error(typeof message === "string" ? message : "Verifica los datos del formulario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-foreground/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-foreground/5 flex items-center justify-between relative z-10 shrink-0 bg-foreground/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <Contact className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">
                {isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <p className="text-xs text-foreground/40 font-medium flex items-center gap-1.5 uppercase tracking-widest">
                <Sparkles size={12} className="text-primary" />
                {isEditMode ? "Actualiza la ficha del cliente" : "Registra un nuevo cliente"}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden relative z-10">
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input 
                {...register("full_name")}
                placeholder="Ej. Isabella Martínez"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                className={cn(
                  "w-full px-5 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground transition-all",
                  errors.full_name ? "border-red-500/40 bg-red-500/5" : ""
                )}
                onFocus={(e) => !errors.full_name && (e.target.style.borderColor = 'var(--input-focus-border)')}
                onBlur={(e) => !errors.full_name && (e.target.style.borderColor = 'var(--input-border)')}
              />
              {errors.full_name && <p className="text-[10px] text-red-500 pl-2">{errors.full_name.message}</p>}
            </div>

            {/* Identificación */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">
                Número de Identificación
              </label>
              <input 
                {...register("identity_number")}
                placeholder="Ej. 1234567890"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                className={cn(
                  "w-full px-5 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground transition-all",
                  errors.identity_number ? "border-red-500/40 bg-red-500/5" : ""
                )}
                onFocus={(e) => !errors.identity_number && (e.target.style.borderColor = 'var(--input-focus-border)')}
                onBlur={(e) => !errors.identity_number && (e.target.style.borderColor = 'var(--input-border)')}
              />
              {errors.identity_number && <p className="text-[10px] text-red-500 pl-2">{errors.identity_number.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Email</label>
                <input 
                  {...register("email")}
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className={cn(
                    "w-full px-5 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground transition-all",
                    errors.email ? "border-red-500/40 bg-red-500/5" : ""
                  )}
                  onFocus={(e) => !errors.email && (e.target.style.borderColor = 'var(--input-focus-border)')}
                  onBlur={(e) => !errors.email && (e.target.style.borderColor = 'var(--input-border)')}
                />
                {errors.email && <p className="text-[10px] text-red-500 pl-2">{errors.email.message}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Teléfono</label>
                <input 
                  {...register("phone")}
                  placeholder="+57 300 000 0000"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className={cn(
                    "w-full px-5 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground transition-all",
                    errors.phone ? "border-red-500/40 bg-red-500/5" : ""
                  )}
                  onFocus={(e) => !errors.phone && (e.target.style.borderColor = 'var(--input-focus-border)')}
                  onBlur={(e) => !errors.phone && (e.target.style.borderColor = 'var(--input-border)')}
                />
                {errors.phone && <p className="text-[10px] text-red-500 pl-2">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Fecha de Nacimiento</label>
              <input 
                {...register("birth_date")}
                type="date"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                className={cn(
                  "w-full px-5 py-4 border rounded-[1.25rem] focus:outline-none focus:ring-1 text-sm text-foreground transition-all",
                  errors.birth_date ? "border-red-500/40 bg-red-500/5" : ""
                )}
                onFocus={(e) => !errors.birth_date && (e.target.style.borderColor = 'var(--input-focus-border)')}
                onBlur={(e) => !errors.birth_date && (e.target.style.borderColor = 'var(--input-border)')}
              />
              {errors.birth_date && <p className="text-[10px] text-red-500 pl-2">{errors.birth_date.message}</p>}
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
                  {isEditMode ? "GUARDAR CAMBIOS" : "REGISTRAR CLIENTE"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
