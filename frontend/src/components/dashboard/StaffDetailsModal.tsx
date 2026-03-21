import { X, Mail, Phone, Pencil, Archive, CheckCircle2, RefreshCcw } from "lucide-react";

interface StaffDetailsModalProps {
  member: any;
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export default function StaffDetailsModal({ member, onClose, onEdit, onArchive, onRestore }: StaffDetailsModalProps) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-foreground/10 rounded-3xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 border-b border-foreground/10 flex items-center justify-between relative z-10 shrink-0">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Detalles del Empleado
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-foreground/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 relative z-10 flex flex-col items-center overflow-y-auto custom-scrollbar flex-1">
          <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-3xl font-bold mb-2">
            {member.full_name.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center w-full">
            <h3 className="text-2xl font-black text-foreground">{member.full_name}</h3>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
              member.active 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}>
              {member.active ? <CheckCircle2 size={12} /> : <Archive size={12} />}
              {member.active ? 'Activo' : 'Archivado'}
            </div>
          </div>

          <div className="w-full space-y-4 pt-6 border-t border-foreground/10">
            <div className="flex items-center gap-4 bg-foreground/5 p-4 rounded-2xl border border-foreground/5">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-primary/70 border-b-2 border-primary/50">ID</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">Identificación</p>
                <p className="text-foreground font-medium truncate">{member.identification_number || 'No especificada'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-foreground/5 p-4 rounded-2xl border border-foreground/5">
              <Mail className="text-primary/70 shrink-0" size={20} />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">Correo Electrónico</p>
                <p className="text-foreground font-medium truncate">{member.email || 'No especificado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-foreground/5 p-4 rounded-2xl border border-foreground/5">
              <Phone className="text-primary/70 shrink-0" size={20} />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">Teléfono</p>
                <p className="text-foreground font-medium truncate">{member.phone || 'No especificado'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-foreground/10 bg-foreground/5 flex flex-col-reverse sm:flex-row gap-3 relative z-10 shrink-0">
          {onArchive && member.active && (
            <button 
              onClick={onArchive}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold rounded-xl transition-all"
            >
              <Archive size={18} />
              Archivar
            </button>
          )}
          {onRestore && !member.active && (
            <button 
              onClick={onRestore}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-xl transition-all"
            >
              <RefreshCcw size={18} />
              Restaurar
            </button>
          )}
          {onEdit && member.active && (
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
