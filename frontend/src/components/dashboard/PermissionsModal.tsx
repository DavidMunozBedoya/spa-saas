import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PermissionsModalProps {
  member: any; // User object
  onClose: () => void;
  spaId: string;
}

// La lista ALL_PERMISSIONS ahora se carga dinámicamente desde el backend
interface SystemPermission {
  id: number;
  code: string;
  description: string;
}

export default function PermissionsModal({ member, onClose, spaId }: PermissionsModalProps) {
  const [allSystemPermissions, setAllSystemPermissions] = useState<SystemPermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingPermission, setTogglingPermission] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);

      // Cargar catálogo de permisos y los actuales del usuario
      const [allRes, userRes] = await Promise.all([
        api.get("/users/permissions/list"),
        api.get(`/users/${member.id}/permissions`)
      ]);

      setAllSystemPermissions(allRes.data || []);
      setUserPermissions(userRes.data.permissions || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al sincronizar el catálogo de permisos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (code: string, isCurrentlyGranted: boolean) => {
    try {
      setTogglingPermission(code);
      const action = isCurrentlyGranted ? "revoke" : "grant";
      
      await api.post(`/users/${member.id}/permissions/${action}`, 
        { permission_code: code }
      );
      
      toast.success(`Permiso ${isCurrentlyGranted ? 'revocado' : 'concedido'} con éxito`);
      
      // Actualizar vista virtual para no recargar red
      if (isCurrentlyGranted) {
        setUserPermissions(prev => prev.filter(p => p !== code));
      } else {
        setUserPermissions(prev => [...prev, code]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al alterar el nivel de acceso");
      fetchPermissions(); // Sync back in case of error
    } finally {
      setTogglingPermission(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-foreground/10 rounded-3xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Header */}
        <div className="p-6 border-b border-foreground/10 flex items-center justify-between shrink-0 relative z-10 bg-foreground/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight italic">Permisos Dinámicos</h2>
              <p className="text-sm text-foreground/50 font-medium">Control de privilegios para <b className="text-foreground">{member.full_name}</b></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex gap-2 text-primary/80 items-center">
            <ShieldCheck className="w-5 h-5 shrink-0 text-primary" />
            <div className="text-xs">
              <p className="font-bold text-primary mb-0.5">Control Independiente por Empleado</p>
              <p className="text-[10px] sm:text-xs">Puedes establecer un permiso absoluto (Permitir/Bloquear) que prevalecerá sobre las reglas asignadas por el rol base del empleado.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
              <p className="text-foreground/50 font-bold text-sm tracking-widest uppercase">Analizando privilegios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {allSystemPermissions
                .filter(p => p.code !== 'platform:manage')
                .map(perm => {
                const isGranted = userPermissions.includes(perm.code);
                const isLoadingToggle = togglingPermission === perm.code;

                return (
                  <div key={perm.code} className="flex flex-col xl:flex-row xl:items-center justify-between p-2.5 bg-foreground/5 rounded-2xl border border-foreground/5 hover:border-primary/20 transition-all gap-2 xl:gap-0">
                    <div className="pr-2">
                      <p className="font-bold text-foreground mb-0.5 text-xs flex items-center gap-1.5">
                        {isGranted && <CheckCircle2 size={12} className="text-emerald-500" />}
                        {perm.code.split(':').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </p>
                      <p className="text-[10px] text-foreground/50 leading-tight">
                        {perm.description}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-primary/40 font-mono mt-0.5">
                        {perm.code}
                      </p>
                    </div>

                    <div className={`flex items-center gap-3 shrink-0 bg-foreground/10 p-1.5 rounded-xl border border-foreground/10 self-start xl:self-auto ${isLoadingToggle ? 'opacity-50 pointer-events-none' : ''}`}>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs group">
                          <input 
                            type="radio" 
                            name={`perm-${perm.code}`}
                            checked={isGranted}
                            onChange={() => { if (!isGranted) handleToggle(perm.code, false); }}
                            className="w-3.5 h-3.5 text-emerald-500 bg-foreground/10 border-foreground/20 focus:ring-emerald-500 focus:ring-offset-background"
                          />
                        <span className={isGranted ? "text-emerald-400 font-bold" : "text-foreground/50 group-hover:text-foreground/80 transition-colors"}>Permitir</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs group">
                        <input 
                          type="radio" 
                          name={`perm-${perm.code}`}
                          checked={!isGranted}
                          onChange={() => { if (isGranted) handleToggle(perm.code, true); }}
                          className="w-3.5 h-3.5 text-red-500 bg-foreground/10 border-foreground/20 focus:ring-red-500 focus:ring-offset-background"
                        />
                        <span className={!isGranted ? "text-red-400 font-bold" : "text-foreground/50 group-hover:text-foreground/80 transition-colors"}>Bloquear</span>
                      </label>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-foreground/10 bg-foreground/5 shrink-0 flex justify-end">
           <button 
              onClick={onClose} 
              className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all text-sm"
            >
              Listo
            </button>
        </div>

      </div>
    </div>
  );
}
