"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { X, Building2, User, Mail, Lock, Loader2, Globe, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const newSpaSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  spaEmail: z.string().email("Correo de Spa inválido"),
  timezone: z.string().min(1, "Zona horaria es requerida"),
  ownerName: z.string().min(2, "El nombre del propietario es requerido"),
  ownerEmail: z.string().email("Correo del propietario inválido"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type NewSpaFormValues = z.infer<typeof newSpaSchema>;

interface NewSpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewSpaModal({ isOpen, onClose, onSuccess }: NewSpaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewSpaFormValues>({
    resolver: zodResolver(newSpaSchema),
    defaultValues: {
      timezone: "America/Bogota" // Por defecto, se puede cambiar
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: NewSpaFormValues) => {
    setIsLoading(true);
    try {
      // Endpoint /api/platform/register protegido por token SuperAdmin
      await api.post("/platform/register", {
          name: data.name,
          spaEmail: data.spaEmail,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          password: data.password,
          timezone: data.timezone
      });
      
      toast.success("Spa registrado exitosamente");
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Error al crear el Spa";
      toast.error(typeof message === "string" ? message : "Ocurrió un error. Verifica los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 z-0" 
        onClick={() => !isLoading && onClose()}
      />
      
      <div className="relative z-10 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden glass rounded-3xl border border-foreground/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-foreground/5 bg-foreground/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
              <Building2 className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight italic">Registrar Nuevo Spa</h2>
              <p className="text-xs text-foreground/50 font-medium">Crea el inquilino y su cuenta de propietario inicial</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              
              {/* Sección SPA */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Datos del Spa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80 pl-1">Nombre Comercial</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                      <input
                        {...register("name")}
                        placeholder="Ej. Spa Relax"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                        className={cn(
                          "w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                          errors.name ? "border-red-500/50" : ""
                        )}
                        onFocus={(e) => !errors.name && (e.target.style.borderColor = 'var(--input-focus-border)')}
                        onBlur={(e) => !errors.name && (e.target.style.borderColor = 'var(--input-border)')}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] text-red-500 pl-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80 pl-1">Email del Spa</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                      <input
                        {...register("spaEmail")}
                        type="email"
                        placeholder="contacto@spa.com"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                        className={cn(
                          "w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                          errors.spaEmail ? "border-red-500/50" : ""
                        )}
                        onFocus={(e) => !errors.spaEmail && (e.target.style.borderColor = 'var(--input-focus-border)')}
                        onBlur={(e) => !errors.spaEmail && (e.target.style.borderColor = 'var(--input-border)')}
                      />
                    </div>
                    {errors.spaEmail && <p className="text-[10px] text-red-500 pl-1">{errors.spaEmail.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-foreground/80 pl-1">Zona Horaria</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                      <select
                        {...register("timezone")}
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                        className={cn(
                          "w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-1 transition-all appearance-none text-foreground",
                          errors.timezone ? "border-red-500/50" : ""
                        )}
                        onFocus={(e) => !errors.timezone && (e.target.style.borderColor = 'var(--input-focus-border)')}
                        onBlur={(e) => !errors.timezone && (e.target.style.borderColor = 'var(--input-border)')}
                      >
                        <option value="America/Bogota" className="bg-background text-foreground">América/Bogotá (UTC-5)</option>
                        <option value="America/Mexico_City" className="bg-background text-foreground">América/Ciudad de México</option>
                        <option value="America/Argentina/Buenos_Aires" className="bg-background text-foreground">América/Buenos Aires</option>
                        <option value="Europe/Madrid" className="bg-background text-foreground">Europa/Madrid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección PROPIETARIO */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-2 lg:mb-4">Administrador Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80 pl-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                      <input
                        {...register("ownerName")}
                        placeholder="Juan Pérez"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                        className={cn(
                          "w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                          errors.ownerName ? "border-red-500/50" : ""
                        )}
                        onFocus={(e) => !errors.ownerName && (e.target.style.borderColor = 'var(--input-focus-border)')}
                        onBlur={(e) => !errors.ownerName && (e.target.style.borderColor = 'var(--input-border)')}
                      />
                    </div>
                    {errors.ownerName && <p className="text-[10px] text-red-500 pl-1">{errors.ownerName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80 pl-1">Email (Acceso)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                      <input
                        {...register("ownerEmail")}
                        type="email"
                        autoComplete="none"
                        placeholder="juan@ejemplo.com"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                        className={cn(
                          "w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                          errors.ownerEmail ? "border-red-500/50" : ""
                        )}
                        onFocus={(e) => !errors.ownerEmail && (e.target.style.borderColor = 'var(--input-focus-border)')}
                        onBlur={(e) => !errors.ownerEmail && (e.target.style.borderColor = 'var(--input-border)')}
                      />
                    </div>
                    {errors.ownerEmail && <p className="text-[10px] text-red-500 pl-1">{errors.ownerEmail.message}</p>}
                  </div>

                  <div className="space-y-2 border-t border-foreground/5 pt-4 mt-2 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground/80 pl-1">Contraseña</label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                        <input
                          {...register("password")}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Mín. 8 carac. + Mayús + Núm + Especial"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                          className={cn(
                            "w-full pl-9 pr-12 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                            errors.password ? "border-red-500/50" : ""
                          )}
                          onFocus={(e) => !errors.password && (e.target.style.borderColor = 'var(--input-focus-border)')}
                          onBlur={(e) => !errors.password && (e.target.style.borderColor = 'var(--input-border)')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {!errors.password && (
                        <p className="text-[9px] text-foreground/40 pl-1 mt-1">
                          Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
                        </p>
                      )}
                      {errors.password && <p className="text-[10px] text-red-500 pl-1 mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground/80 pl-1">Confirmar Contraseña</label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                        <input
                          {...register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                          className={cn(
                            "w-full pl-9 pr-12 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground",
                            errors.confirmPassword ? "border-red-500/50" : ""
                          )}
                          onFocus={(e) => !errors.confirmPassword && (e.target.style.borderColor = 'var(--input-focus-border)')}
                          onBlur={(e) => !errors.confirmPassword && (e.target.style.borderColor = 'var(--input-border)')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-[10px] text-red-500 pl-1 mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end p-4 md:p-6 bg-foreground/5 border-t border-foreground/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-foreground/5 border border-foreground/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              {isLoading ? "Creando..." : "Crear e Iniciar Spa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
