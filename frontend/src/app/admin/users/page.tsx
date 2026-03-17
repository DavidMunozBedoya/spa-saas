"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Plus, 
  Power, 
  Trash2, 
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Shield,
  Building2,
  Edit2,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import NewAdminModal from "@/components/dashboard/NewAdminModal";
import EditAdminModal from "@/components/dashboard/EditAdminModal";
import { cn } from "@/lib/utils";

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  created_at: string;
  spa_name: string;
  spa_deleted: boolean;
  role: string;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/platform/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching platform users:", error);
      toast.error("Error al cargar los usuarios de plataforma");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: PlatformUser) => {
    try {
      await api.patch(`/platform/users/${user.id}`, { active: !user.active });
      toast.success(`Usuario ${user.active ? 'desactivado' : 'activado'} correctamente`);
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !user.active } : u));
    } catch (error) {
      toast.error("Error al cambiar el estado del usuario");
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/platform/users/${userToDelete}`);
      toast.success("Usuario eliminado correctamente");
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar el usuario");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user && !user.spa_deleted) {
      toast.error("No se puede eliminar al administrador porque su Spa asociado no ha sido eliminado. Para revocar el acceso sin eliminar el Spa, ponga el usuario como inactivo o cambie sus credenciasles.");
      return;
    }
    setUserToDelete(id);
  };

  const openEditModal = (user: PlatformUser) => {
    setEditingUser(user);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.spa_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Users className="text-primary" size={32} />
            Dueños de Spas
          </h1>
          <p className="text-muted-foreground-auto mt-1 font-medium italic">Supervisa y gestiona el acceso de los administradores de cada Spa tenant.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por dueño o Spa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-80 text-sm text-foreground"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            Nuevo Administrador
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/5 border-b border-foreground/10">
                <th className="px-6 py-5 text-sm font-bold text-foreground/40 uppercase tracking-widest">Administrador</th>
                <th className="px-6 py-5 text-sm font-bold text-foreground/40 uppercase tracking-widest">Spa Asociado</th>
                <th className="px-6 py-5 text-sm font-bold text-foreground/40 uppercase tracking-widest">Registro</th>
                <th className="px-6 py-5 text-sm font-bold text-foreground/40 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-sm font-bold text-foreground/40 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-foreground/40 font-medium">Cargando administradores...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                      <Users className="text-foreground/20" size={32} />
                    </div>
                    <p className="text-foreground font-medium">No se encontraron administradores</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary/20 transition-all font-bold">
                          {user.full_name?.charAt(0) || <Mail size={18} />}
                        </div>
                        <div>
                          <p className="text-foreground font-bold group-hover:text-primary transition-colors">{user.full_name || 'Sin Nombre'}</p>
                          <p className="text-foreground/40 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Building2 size={14} className="text-primary/60" />
                        <span className="text-sm font-medium">{user.spa_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-foreground/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        user.active 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {user.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {user.active ? 'Activo' : 'Suspendido'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(user)}
                          title="Editar Datos"
                          className="p-2.5 text-foreground/40 border border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 hover:text-foreground rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          title={user.active ? 'Habilitar/Relajar Acceso' : 'Suspender Acceso'}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            user.active 
                            ? 'text-red-400 border-red-500/10 hover:bg-red-500/10' 
                            : 'text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/10'
                          )}
                        >
                          <Power size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(user.id)}
                          title="Eliminar (Soft Delete)"
                          className="p-2.5 text-foreground/40 border border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 hover:text-foreground rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Administrador"
        description="¿Estás seguro de que deseas eliminar este administrador de la plataforma? Se realizará un Soft Delete, perdiendo el acceso al sistema."
        isProcessing={isDeleting}
      />

      {/* Edit Modal */}
      <EditAdminModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={fetchUsers}
      />

      {/* New Admin Modal */}
      <NewAdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
