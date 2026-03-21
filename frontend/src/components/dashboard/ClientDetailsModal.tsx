"use client";

import { 
  X, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Pencil, 
  Archive,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Cake
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientDetailsModalProps {
  client: any;
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onReactivate?: () => void;
}

export default function ClientDetailsModal({ 
  client, 
  onClose, 
  onEdit, 
  onArchive,
  onReactivate
}: ClientDetailsModalProps) {

  const birthDate = client.birth_date ? new Date(client.birth_date) : null;
  const createdAt = new Date(client.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background w-full max-w-lg rounded-[2.5rem] border border-foreground/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative h-28 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-end p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all z-10"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground text-xl font-black italic">
              {client.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight uppercase">{client.full_name}</h2>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border mt-1",
                client.active 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {client.active ? <CheckCircle2 size={10} /> : <Archive size={10} />}
                {client.active ? "Activo" : "Archivado"}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Identificación */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Identificación</label>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                <CreditCard size={16} className="text-primary/60 shrink-0" />
                <span className="text-sm font-bold text-foreground">
                  {client.identity_number || "No registrada"}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Email</label>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                <Mail size={16} className="text-primary/60 shrink-0" />
                <span className="text-sm font-bold text-foreground truncate">
                  {client.email || "No registrado"}
                </span>
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Teléfono</label>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                <Phone size={16} className="text-primary/60 shrink-0" />
                <span className="text-sm font-bold text-foreground">
                  {client.phone || "No registrado"}
                </span>
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Fecha de Nacimiento</label>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                <Cake size={16} className="text-primary/60 shrink-0" />
                <span className="text-sm font-bold text-foreground">
                  {birthDate 
                    ? birthDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) 
                    : "No registrada"}
                </span>
              </div>
            </div>
          </div>

          {/* Registro */}
          <div className="pt-2 border-t border-foreground/5">
            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest text-center">
              Cliente desde {createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {client.active ? (
              <>
                {onEdit && (
                  <button 
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground font-bold hover:bg-foreground/10 hover:border-foreground/20 transition-all active:scale-[0.98] text-sm"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                )}
                {onArchive && (
                  <button 
                    onClick={onArchive}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    <Archive size={20} />
                  </button>
                )}
              </>
            ) : (
              onReactivate && (
                <button 
                  onClick={onReactivate}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all active:scale-[0.98] text-sm"
                >
                  <RefreshCcw size={16} />
                  Restaurar Cliente
                </button>
              )
            )}
            {!onEdit && !onArchive && !onReactivate && (
              <button 
                onClick={onClose}
                className="w-full flex items-center justify-center py-3.5 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground/60 font-bold hover:bg-foreground/10 transition-all text-sm"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
