import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface NewServiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any | null;
}

export default function NewServiceModal({ onClose, onSuccess, editData }: NewServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price: "" as number | string,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        duration_minutes: editData.duration_minutes || 60,
        price: editData.price ? Number(editData.price) : "",
      });
    }
  }, [editData]);

  const formatDuration = (minutes: number | string) => {
    const mins = Number(minutes);
    if (!mins || isNaN(mins)) return "0 min";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const formatPrice = (val: string | number) => {
    if (val === "" || val === undefined) return "";
    const num = String(val).replace(/\D/g, "");
    return new Intl.NumberFormat('es-CO').format(Number(num));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "price") {
      // Professional sanitization: keep only digits
      const sanitizedValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration_minutes" ? (value !== "" ? Number(value) : "") : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = { ...formData };
      payload.price = payload.price ? Number(payload.price) : 0;
      
      if (payload.description === "") {
        payload.description = null;
      }

      if (editData) {
        // Edit Mode
        await api.patch(`/services/${editData.id}`, payload);
        toast.success("Servicio actualizado exitosamente");
      } else {
        // Create Mode
        await api.post("/services", payload);
        toast.success("Servicio creado exitosamente");
      }
      onSuccess();
    } catch (error: any) {
      const errData = error.response?.data;
      if (errData?.errors && errData.errors.length > 0) {
        toast.error(`Error: ${errData.errors[0].path} - ${errData.errors[0].message}`);
        console.error("Validation Errors:", errData.errors);
      } else {
        toast.error(errData?.error || errData?.message || "Error al guardar el servicio");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-foreground/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 border-b border-foreground/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight italic">
                {editData ? "Editar Servicio" : "Nuevo Servicio"}
              </h2>
              <p className="text-xs text-foreground/50 font-medium">Define los detalles del tratamiento</p>
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
              
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Nombre del Servicio <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required
                  placeholder="Ej. Masaje Relajante"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Duración <span className="text-red-400">*</span></label>
                  <span className="text-[10px] bg-foreground/10 px-2 py-0.5 rounded text-foreground/60 font-bold uppercase tracking-widest">
                    {formatDuration(formData.duration_minutes)}
                  </span>
                </div>
                <input 
                  type="number" 
                  name="duration_minutes" 
                  value={formData.duration_minutes} 
                  onChange={handleChange} 
                  required
                  min="1"
                  step="1"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground font-medium"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Precio (COP) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-bold">$</span>
                  <input 
                    type="text" 
                    name="price" 
                    value={formatPrice(formData.price)} 
                    onChange={handleChange} 
                    required
                    placeholder="Ej. 150.000"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground font-medium"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
                <p className="text-[10px] text-foreground/40 pl-1 mt-1">
                  Ingrese el valor sin puntos ni comas (Ej: 150000)
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Descripción</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder="Detalles sobre las técnicas aplicadas y beneficios..."
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground resize-none placeholder:text-foreground/20"
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
            </div>

            <div className="pt-2 flex gap-4 border-t border-foreground/10 mt-2 shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-foreground/5 text-foreground font-bold rounded-xl border border-foreground/10 hover:bg-foreground/10 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editData ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
