"use client";

import { useState, useEffect } from "react";
import { UserPlus, Building2, User, Mail, Lock, X, Loader2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Spa {
  id: string;
  name: string;
}

interface NewAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewAdminModal({ isOpen, onClose, onSuccess }: NewAdminModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [spas, setSpas] = useState<Spa[]>([]);
  const [isLoadingSpas, setIsLoadingSpas] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    spaId: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchSpas();
    }
  }, [isOpen]);

  const fetchSpas = async () => {
    setIsLoadingSpas(true);
    try {
      const response = await api.get("/platform/spas");
      // Filter out only active ones optionally, or all non-deleted
      setSpas(response.data);
    } catch (error) {
      console.error("Error fetching spas:", error);
      toast.error("Error al cargar la lista de Spas");
    } finally {
      setIsLoadingSpas(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/platform/users", formData);
      
      toast.success("Administrador creado exitosamente");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        spaId: "",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear el administrador");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="glass w-full max-w-2xl rounded-3xl border border-foreground/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-foreground/5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 text-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight italic">Nuevo Administrador</h3>
              <p className="text-xs text-foreground/50 font-medium">Asignar propietario a Spa existente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Spa Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">
                Seleccionar Spa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                <select
                  name="spaId"
                  required
                  value={formData.spaId}
                  onChange={handleChange}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground appearance-none shadow-sm",
                    !formData.spaId && "text-foreground/40"
                  )}
                >
                  <option value="" disabled>Seleccione un Spa existente...</option>
                  {isLoadingSpas ? (
                    <option disabled>Cargando Spas...</option>
                  ) : (
                    spas.map((spa) => (
                      <option key={spa.id} value={spa.id} className="bg-background text-foreground">
                        {spa.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    type="text"
                    name="fullName"
                    required
                    placeholder="Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    type="email"
                    name="email"
                    required
                    autoComplete="none"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end p-4 md:p-6 bg-foreground/5 border-t border-foreground/10 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-xl border border-foreground/10 transition-all text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || isLoadingSpas}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Crear Administrador
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
