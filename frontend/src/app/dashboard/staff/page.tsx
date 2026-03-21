"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Plus, 
  Search, 
  Pencil, 
  Archive, 
  Loader2, 
  Mail, 
  Phone,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import NewStaffModal from "@/components/dashboard/NewStaffModal";
import StaffDetailsModal from "@/components/dashboard/StaffDetailsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [viewingStaff, setViewingStaff] = useState<any | null>(null);
  
  const [staffToArchive, setStaffToArchive] = useState<{id: string, name: string} | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const { hasPermission } = usePermissions();
  const hasManageStaff = hasPermission("staff:manage");

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/staff", { params: { includeArchived: "true" } });
      setStaffList(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar el personal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [showInactive]);

  const handleArchiveRequest = (id: string, name: string) => {
    setStaffToArchive({ id, name });
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/staff/${id}/restore`, {});
      toast.success("Empleado restaurado exitosamente");
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al restaurar al empleado");
    }
  };

  const executeArchive = async () => {
    if (!staffToArchive) return;
    setIsArchiving(true);
    
    try {
      await api.delete(`/staff/${staffToArchive.id}`);
      toast.success("Miembro del personal archivado exitosamente");
      setStaffToArchive(null);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al archivar al empleado");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEdit = (staff: any) => {
    setIsDetailsOpen(false);
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (staff: any) => {
    setViewingStaff(staff);
    setIsDetailsOpen(true);
  };

  const handleArchiveFromDetails = () => {
    if (viewingStaff) {
      setIsDetailsOpen(false);
      handleArchiveRequest(viewingStaff.id, viewingStaff.full_name);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = showInactive ? s.active === false : s.active === true;

    return matchesSearch && matchesStatus;
  });

  return (
    <PermissionGuard permission="staff:view">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 sm:px-4">
        
        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight italic">
              <Users className="text-primary" size={32} />
              Plantilla de Personal
            </h1>
            <p className="text-muted-foreground-auto mt-1 font-medium uppercase text-[10px] tracking-widest">
              Administra a los terapeutas, estilistas y empleados
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
              <input 
                type="text" 
                placeholder="Buscar personal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/20"
              />
            </div>
            
            <button 
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-bold text-xs uppercase tracking-widest ${
                showInactive 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'
              }`}
            >
              <Archive size={16} />
              {showInactive ? "Ver Activos" : "Ver Archivados"}
            </button>

            {hasManageStaff && (
              <button 
                onClick={handleOpenNew}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Plus size={20} />
                Nuevo
              </button>
            )}
          </div>
        </div>

        {/* Staff List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-foreground/10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
              <Users className="text-foreground/30 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No se encontró personal</h3>
            <p className="text-foreground/50 max-w-md">
              {searchQuery 
                ? "Prueba buscar con otro término u otro correo." 
                : "Comienza a agregar a tu equipo de trabajo para asignarles servicios posteriormente."}
            </p>
            {!searchQuery && hasManageStaff && (
              <button 
                onClick={handleOpenNew}
                className="mt-6 px-6 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground font-medium rounded-xl transition-colors"
              >
                Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="glass rounded-3xl border border-foreground/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/5 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                    <th className="p-4 font-black pl-6">Empleado</th>
                    <th className="p-4 font-black">Contacto</th>
                    <th className="p-4 font-black">Estado</th>
                    <th className="p-4 font-black text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filteredStaff.map((staff) => (
                    <tr 
                      key={staff.id} 
                      onClick={() => handleViewDetails(staff)}
                      className={`group transition-colors cursor-pointer ${!staff.active ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-foreground/5'}`}
                    >
                      <td className="p-4 pl-6 relative">
                        {!staff.active && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50" />
                        )}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold shrink-0 ${!staff.active ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-primary/20 border-primary/30 text-primary'}`}>
                            {staff.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${!staff.active ? 'text-amber-500' : 'text-foreground'}`}>{staff.full_name}</p>
                            <p className={`text-[10px] mt-0.5 truncate flex items-center gap-1 ${!staff.active ? 'text-amber-500/70' : 'text-foreground/50'}`}>
                              <span className={`border px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${!staff.active ? 'border-amber-500/20 bg-amber-500/10' : 'border-foreground/10 bg-foreground/5'}`}>ID</span>
                              {staff.identification_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {staff.email ? (
                             <div className="flex items-center gap-2 text-foreground/80 font-medium">
                               <Mail size={12} className="text-foreground/40" />
                               {staff.email}
                             </div>
                          ) : null}
                          {staff.phone ? (
                            <div className="flex items-center gap-2 text-foreground/80 font-medium">
                               <Phone size={12} className="text-foreground/40" />
                               {staff.phone}
                             </div>
                          ) : null}
                          {!staff.email && !staff.phone && (
                            <span className="text-foreground/40 text-[10px] italic">Sin contacto registrado</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          staff.active 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {staff.active ? <CheckCircle2 size={12} /> : <Archive size={12} />}
                          {staff.active ? 'Activo' : 'Archivado'}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {hasManageStaff && (
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {!staff.active ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRestore(staff.id); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest" 
                                title="Restaurar"
                              >
                                <RefreshCcw size={14} />
                                Restaurar
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(staff); }} 
                                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors" 
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleArchiveRequest(staff.id, staff.full_name); }} 
                                  className="p-2 text-foreground/40 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" 
                                  title="Archivar"
                                >
                                  <Archive size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isDetailsOpen && viewingStaff && (
          <StaffDetailsModal 
            member={viewingStaff}
            onClose={() => setIsDetailsOpen(false)}
            onEdit={hasManageStaff && viewingStaff.active ? () => handleEdit(viewingStaff) : undefined}
            onArchive={hasManageStaff && viewingStaff.active ? handleArchiveFromDetails : undefined}
            onRestore={hasManageStaff && !viewingStaff.active ? async () => {
              await handleRestore(viewingStaff.id);
              setIsDetailsOpen(false);
            } : undefined}
          />
        )}

        {/* Form Modal */}
        {isModalOpen && (
          <NewStaffModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchStaff();
            }}
            editData={editingStaff}
          />
        )}

        {/* Confirm Archive Modal */}
        <ConfirmModal
          isOpen={!!staffToArchive}
          onClose={() => setStaffToArchive(null)}
          onConfirm={executeArchive}
          title="Archivar Empleado"
          description={`¿Estás seguro de que deseas archivar a "${staffToArchive?.name}"? Esta acción lo removerá de las opciones pero preservará su historial.`}
          isProcessing={isArchiving}
        />

      </div>
    </PermissionGuard>
  );
}
