"use client";

import { useState, useEffect } from "react";
import { Edit2, X, Building2, Mail, Phone, Globe, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Spa {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timezone?: string;
}

interface EditSpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  spa: Spa | null;
  onSuccess: () => void;
}

export default function EditSpaModal({ isOpen, onClose, spa, onSuccess }: EditSpaModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Bogota"
  });

  useEffect(() => {
    if (spa && isOpen) {
      setEditForm({
        name: spa.name,
        email: spa.email,
        phone: spa.phone || "",
        timezone: spa.timezone || "America/Bogota"
      });
    }
  }, [spa, isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spa) return;
    setIsUpdating(true);
    
    try {
      await api.patch(`/platform/spas/${spa.id}`, editForm);
      toast.success("Spa actualizado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al actualizar Spa");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !spa) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-md rounded-3xl border border-foreground/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-foreground/5">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Edit2 size={20} className="text-primary" />
            Editar Spa
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Nombre Comercial</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
              <input 
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Email de Contacto</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
              <input 
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
              <input 
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Zona Horaria</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
              <select
                value={editForm.timezone}
                onChange={(e) => setEditForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground appearance-none shadow-sm"
              >
                <option value="America/Bogota" className="bg-background text-foreground">América/Bogotá (UTC-5)</option>
                <option value="America/Mexico_City" className="bg-background text-foreground">América/Ciudad de México</option>
                <option value="America/Argentina/Buenos_Aires" className="bg-background text-foreground">América/Buenos Aires</option>
                <option value="Europe/Madrid" className="bg-background text-foreground">Europa/Madrid</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-xl border border-foreground/10 transition-all text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Actualizar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
