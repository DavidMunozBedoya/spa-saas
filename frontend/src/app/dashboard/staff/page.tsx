"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
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
  
  const [staffToDelete, setStaffToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = usePermissions();
  const hasManageStaff = hasPermission("staff:manage");

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/staff?includeInactive=${showInactive}`);
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

  const handleDeleteRequest = (id: string, name: string) => {
    setStaffToDelete({ id, name });
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.patch(`/staff/${id}/reactivate`, {});
      toast.success("Empleado reactivado exitosamente");
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al reactivar al empleado");
    }
  };

  const executeDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    
    try {
      await api.delete(`/staff/${staffToDelete.id}`);
      toast.success("Miembro del personal desactivado exitosamente");
      setStaffToDelete(null);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar al empleado");
    } finally {
      setIsDeleting(false);
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

  const handleDeleteFromDetails = () => {
    if (viewingStaff) {
      setIsDetailsOpen(false);
      handleDeleteRequest(viewingStaff.id, viewingStaff.full_name);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = showInactive ? true : s.active === true;

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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-medium text-[10px] uppercase tracking-widest ${
                showInactive 
                ? 'bg-primary/20 border-primary text-primary' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/50 hover:bg-foreground/10'
              }`}
            >
              {showInactive ? <Eye size={18} /> : <EyeOff size={18} />}
              {showInactive ? "Viendo Todo" : "Ver Eliminados"}
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
                      className="group hover:bg-foreground/5 transition-colors cursor-pointer"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
                            {staff.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{staff.full_name}</p>
                            <p className="text-[10px] text-foreground/50 mt-0.5 truncate flex items-center gap-1">
                              <span className="border border-foreground/10 bg-foreground/5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">ID</span>
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
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {staff.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {staff.active ? 'Activo' : 'Inactivo'}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {hasManageStaff && (
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {!staff.active ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleReactivate(staff.id); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest" 
                                title="Reactivar"
                              >
                                <RefreshCcw size={14} />
                                Reactivar
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
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRequest(staff.id, staff.full_name); }} 
                                  className="p-2 text-foreground/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
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
            onEdit={hasManageStaff ? () => handleEdit(viewingStaff) : undefined}
            onDelete={hasManageStaff ? handleDeleteFromDetails : undefined}
            onReactivate={hasManageStaff ? async () => {
              await handleReactivate(viewingStaff.id);
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

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={!!staffToDelete}
          onClose={() => setStaffToDelete(null)}
          onConfirm={executeDelete}
          title="Desactivar Empleado"
          description={`¿Estás seguro de que deseas desactivar a "${staffToDelete?.name}"? Esta acción lo removerá de las opciones pero preservará su historial.`}
          isProcessing={isDeleting}
        />

      </div>
    </PermissionGuard>
  );
}
