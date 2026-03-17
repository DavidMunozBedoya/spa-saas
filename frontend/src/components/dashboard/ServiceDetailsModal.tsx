import { X, Clock, DollarSign, AlignLeft, Pencil, Trash2 } from "lucide-react";

interface ServiceDetailsModalProps {
  service: any;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ServiceDetailsModal({ service, onClose, onEdit, onDelete }: ServiceDetailsModalProps) {
  if (!service) return null;

  const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0 
  }).format(Number(service.price));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-foreground/10 rounded-3xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 border-b border-foreground/10 flex items-center justify-between relative z-10 shrink-0">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Detalles del Servicio
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-foreground/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 relative z-10 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <h3 className="text-2xl font-black text-foreground mb-2">{service.name}</h3>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-semibold">
                <Clock size={16} />
                {formatDuration(service.duration_minutes)}
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg bg-emerald-400/10 px-3 py-1 rounded-lg">
                {formattedPrice}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-foreground/10">
            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2">
              <AlignLeft size={14} /> Descripción
            </h4>
            <p className="text-foreground/80 leading-relaxed text-sm">
              {service.description || "Este servicio no cuenta con una descripción detallada en este momento."}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-foreground/10 bg-foreground/5 flex flex-col-reverse sm:flex-row gap-3 relative z-10 shrink-0">
          {onDelete && (
            <button 
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl transition-all"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          )}
          {onEdit && (
            <button 
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Pencil size={18} />
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
