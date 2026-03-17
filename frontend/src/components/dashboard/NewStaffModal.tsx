import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { X, Loader2, Save, UserPlus, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";

interface NewStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any | null;
}

export default function NewStaffModal({ onClose, onSuccess, editData }: NewStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    identification_number: "",
    email: "",
    phone: "",
    active: true
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        full_name: editData.full_name || "",
        identification_number: editData.identification_number || "",
        email: editData.email || "",
        phone: editData.phone || "",
        active: editData.active !== undefined ? editData.active : true
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = { ...formData };
      if (payload.email === "") payload.email = null;
      if (payload.phone === "") payload.phone = null;

      if (editData) {
        await api.patch(`/staff/${editData.id}`, payload);
        toast.success("Miembro del personal actualizado exitosamente");
      } else {
        try {
          await api.post("/staff", payload);
          toast.success("Miembro del personal registrado exitosamente");
        } catch (error: any) {
          const status = error.response?.status;
          const errorMsg = error.response?.data?.error;
          
          if (status === 409 && (errorMsg === "INACTIVE_DUPLICATE_ID" || errorMsg === "INACTIVE_DUPLICATE_EMAIL")) {
            toast.error(
              <div className="flex flex-col gap-2">
                <p className="font-bold">¡Registro previo detectado!</p>
                <p className="text-xs">Este empleado ya estuvo registrado pero está inactivo. Usa el botón "Ver Inactivos" en la lista para reactivarlo.</p>
                <button 
                  onClick={() => {
                    toast.dismiss();
                  }}
                  className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider self-start"
                >
                  Entendido
                </button>
              </div>,
              { duration: 6000 }
            );
            return;
          }
          throw error;
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background/95 border border-foreground/10 rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-5 border-b border-foreground/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
              <UserPlus className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight italic">
                {editData ? "Editar Personal" : "Nuevo Personal"}
              </h2>
              <p className="text-xs text-foreground/50">{editData ? "Actualiza los datos del empleado" : "Registra un nuevo terapeuta o empleado"}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Nombre Completo <span className="text-red-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                <input 
                  type="text" 
                  name="full_name" 
                  value={formData.full_name} 
                  onChange={handleChange} 
                  required
                  placeholder="Ej. María Pérez"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Número de Identificación <span className="text-red-400">*</span></label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 font-bold text-xs" style={{ width: 16, textAlign: 'center' }}>ID</div>
                <input 
                  type="text" 
                  name="identification_number" 
                  value={formData.identification_number} 
                  onChange={handleChange} 
                  required
                  inputMode="numeric"
                  placeholder="Ej. 1020304050"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Obligatorio"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="Opcional"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
            </div>
            
            
            {editData && (
              <div className="md:col-span-2 flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 mt-1">
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Estado del Empleado</p>
                  <p className="text-xs text-foreground/50">Si desactivas el estado, no tendrá acceso y ya no aparecerá en búsquedas.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-foreground/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-foreground after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            )}

            </div>

            <div className="pt-2 flex gap-3 border-t border-foreground/10 mt-2 shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-xl border border-foreground/10 transition-all text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    {editData ? "Actualizar" : "Guardar"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
