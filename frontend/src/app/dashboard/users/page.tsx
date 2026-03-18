"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  ShieldCheck, 
  Key, 
  Search, 
  Loader2, 
  UserCheck, 
  Power,
  ShieldAlert,
  Pen
} from "lucide-react";
import { toast } from "sonner";
import NewUserModal from "@/components/dashboard/NewUserModal";
import PermissionsModal from "@/components/dashboard/PermissionsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [spaId, setSpaId] = useState<string | null>(null);
  
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = usePermissions();
  const hasManageUsers = hasPermission("users:manage");

  // Extraer el Spa ID del Token JWT
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setSpaId(payload.spaId || payload.spa_id);
      }
    } catch (error) {
      console.error("Token decoding error", error);
    }
  }, []);

  const fetchUsers = async () => {
    if (!spaId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/users/spa/${spaId}`);
      setUsers(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar las credenciales");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [spaId]);
  
  const executeDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Credenciales desactivadas exitosamente");
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al revocar acceso");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (roleIds: number[]) => {
    if (!roleIds || roleIds.length === 0) return { label: 'Sin Rol', color: 'bg-gray-500' };
    
    // Roles Init.sql: 1=Propietario, 2=Admin, 3=Terapeuta, 4=Recepcionista
    if (roleIds.includes(1)) return { label: 'Propietario', color: 'bg-emerald-500 text-emerald-100' };
    if (roleIds.includes(2)) return { label: 'Administrador', color: 'bg-blue-500 text-blue-100' };
    if (roleIds.includes(4)) return { label: 'Recepcionista', color: 'bg-amber-500 text-amber-100' };
    if (roleIds.includes(3)) return { label: 'Terapeuta', color: 'bg-purple-500 text-purple-100' };
    
    return { label: 'Usuario', color: 'bg-foreground/20' };
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PermissionGuard permission="users:manage">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 sm:px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight italic">
              <ShieldCheck className="text-primary" size={32} />
              Accesos y Permisos
            </h1>
            <p className="text-muted-foreground-auto mt-1 font-medium uppercase text-[10px] tracking-widest">
              Gestiona quién tiene acceso a la plataforma
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
              <input 
                type="text" 
                placeholder="Buscar credencial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/20"
              />
            </div>
            {hasManageUsers && (
              <button 
                onClick={() => setIsNewUserModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Key size={20} />
                Generar Acceso
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-foreground/10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Key className="text-primary/50 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron accesos</h3>
            <p className="text-muted-foreground-auto max-w-md font-medium text-sm italic">
              Dale acceso al sistema a tus empleados haciendo clic en "Generar Acceso".
            </p>
          </div>
        ) : (
          <div className="glass rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/5 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                    <th className="p-5 font-black pl-6">Usuario (Credencial)</th>
                    <th className="p-5 font-black">Perfil Vinculado</th>
                    <th className="p-5 font-black">Rol Dominante</th>
                    <th className="p-5 font-black text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role_ids);
                    
                    return (
                      <tr key={user.id} className="hover:bg-foreground/5 transition-colors group">
                        <td className="p-5 pl-6">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">{user.full_name}</p>
                            <p className="text-[10px] text-foreground/50 font-mono mt-0.5">{user.email}</p>
                          </div>
                        </td>
                        
                        <td className="p-5">
                          {user.staff_id ? (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-foreground/5 border border-foreground/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-foreground/80">
                              <UserCheck size={14} className="text-primary" />
                              Staff Asociado
                            </div>
                          ) : (
                            <span className="text-foreground/40 text-[10px] uppercase font-black italic flex items-center gap-1">
                              <ShieldAlert size={12} />
                              Sin vincular
                            </span>
                          )}
                        </td>
                        
                        <td className="p-5">
                          <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl ${roleBadge.color} shadow-sm border border-black/10`}>
                            {roleBadge.label}
                          </span>
                        </td>
  
                        <td className="p-5 pr-6 text-right">
                          {hasManageUsers && (
                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              
                              <button 
                                onClick={() => setEditUser(user)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-foreground/5 hover:bg-foreground/10 text-foreground font-black uppercase tracking-widest rounded-lg border border-foreground/10 transition-colors"
                                title="Editar Credenciales Base"
                              >
                                <Pen size={14} className="text-primary" />
                                Editar
                              </button>
  
                              <button 
                                onClick={() => setPermissionsUser(user)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-foreground/5 hover:bg-foreground/10 text-foreground font-black uppercase tracking-widest rounded-lg border border-foreground/10 transition-colors"
                                title="Gestionar Poderes Dinámicos"
                              >
                                <ShieldCheck size={14} className="text-primary" />
                                Permisos
                              </button>
  
                              <button 
                                onClick={() => setUserToDelete(user)} 
                                className="p-1.5 text-foreground/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20" 
                                title="Revocar Acceso del empleado"
                              >
                                <Power size={18} />
                              </button>
  
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Creación Modal */}
        {isNewUserModalOpen && spaId && (
          <NewUserModal 
            spaId={spaId}
            onClose={() => setIsNewUserModalOpen(false)} 
            onSuccess={() => {
              setIsNewUserModalOpen(false);
              fetchUsers();
            }}
          />
        )}

        {/* Edición Modal */}
        {editUser && spaId && (
          <NewUserModal 
            spaId={spaId}
            editData={editUser}
            onClose={() => setEditUser(null)} 
            onSuccess={() => {
              setEditUser(null);
              fetchUsers();
            }}
          />
        )}

        {/* Permisos Modal */}
        {permissionsUser && spaId && (
          <PermissionsModal 
            spaId={spaId}
            member={permissionsUser}
            onClose={() => setPermissionsUser(null)}
          />
        )}

        {/* Confirm Revoke Modal */}
        <ConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={executeDelete}
          title="Revocar Credenciales"
          description={`¿Estás seguro de que deseas revocar el acceso a "${userToDelete?.full_name}"? Esta persona ya no podrá ingresar al sistema, pero su perfil en el Staff seguirá intacto.`}
          isProcessing={isDeleting}
        />

      </div>
    </PermissionGuard>
  );
}
