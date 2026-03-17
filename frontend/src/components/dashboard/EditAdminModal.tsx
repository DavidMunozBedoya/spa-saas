"use client";

import { useState, useEffect } from "react";
import { Edit2, X, Loader2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  spa_name?: string;
}

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PlatformUser | null;
  onSuccess: () => void;
}

export default function EditAdminModal({ isOpen, onClose, user, onSuccess }: EditAdminModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    if (user && isOpen) {
      setEditForm({
        fullName: user.full_name || "",
        email: user.email,
        password: ""
      });
      setShowEditPassword(false);
    }
  }, [user, isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const data: any = {
        fullName: editForm.fullName,
        email: editForm.email,
        active: user.active
      };
      if (editForm.password) data.password = editForm.password;

      await api.patch(`/platform/users/${user.id}`, data);
      
      toast.success("Administrador actualizado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al actualizar administrador");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-md rounded-3xl border border-foreground/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-foreground/5">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Edit2 size={20} className="text-primary" />
            Editar Administrador
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Nombre Completo</label>
            <input 
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">Correo Electrónico</label>
            <input 
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1 flex justify-between">
              Contraseña
              <span className="text-[10px] lowercase font-normal italic">Dejar vacío para no cambiar</span>
            </label>
            <div className="relative">
              <input 
                type={showEditPassword ? "text" : "password"}
                placeholder="••••••••"
                value={editForm.password}
                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground pr-12"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1"
                tabIndex={-1}
              >
                {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
