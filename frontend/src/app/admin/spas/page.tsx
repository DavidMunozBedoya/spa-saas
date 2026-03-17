"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Building2, 
  Plus, 
  MoreVertical, 
  Power, 
  Trash2, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit2,
  Globe,
  Mail,
  Phone,
  X
} from "lucide-react";
import { toast } from "sonner";
import NewSpaModal from "@/components/dashboard/NewSpaModal";
import EditSpaModal from "@/components/dashboard/EditSpaModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Spa {
  id: string;

  name: string;
  email: string;
  phone: string;
  active: boolean;
  created_at: string;
  timezone: string;
}

export default function ManageSpasPage() {
  const [spas, setSpas] = useState<Spa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpa, setEditingSpa] = useState<Spa | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [spaToDelete, setSpaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Bogota"
  });

  const fetchSpas = async () => {
    try {
      const response = await api.get("/platform/spas");
      setSpas(response.data);
    } catch (error) {
      console.error("Error fetching spas:", error);
      toast.error("Error al cargar la lista de Spas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpas();
  }, []);

  const handleToggleStatus = async (spa: Spa) => {
    try {
      await api.patch(`/platform/spas/${spa.id}/status`, { active: !spa.active });
      toast.success(`Spa ${spa.active ? 'desactivado' : 'activado'} correctamente`);
      fetchSpas();
    } catch (error) {
      toast.error("Error al cambiar el estado del Spa");
    }
  };

  const handleDelete = async () => {
    if (!spaToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/platform/spas/${spaToDelete}`);
      toast.success("Spa eliminado correctamente");
      setSpas(prev => prev.filter(spa => spa.id !== spaToDelete));
      setSpaToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar el Spa");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setSpaToDelete(id);
  };

  const openEditModal = (spa: Spa) => {
    setEditingSpa(spa);
  };

  const filteredSpas = spas.filter(spa => 
    spa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spa.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight italic">Gestión de Spas</h1>
          <p className="text-muted-foreground-auto mt-1 font-medium">Administra los accesos y estados de todos los Spas en la plataforma.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
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
            Nuevo Spa
          </button>
        </div>
      </div>

      {/* Spas Table */}
      <div className="glass rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/5 border-b border-foreground/10 text-foreground/50">
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-widest">Spa</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-widest">Registro</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-foreground/40 font-medium">Cargando base de datos de Spas...</p>
                  </td>
                </tr>
              ) : filteredSpas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-foreground/5">
                      <Building2 className="text-foreground/20" size={32} />
                    </div>
                    <p className="text-foreground font-medium">No se encontraron resultados</p>
                    <p className="text-foreground/40 text-sm mt-1">Intenta ajustar tu búsqueda o crea un nuevo registro.</p>
                  </td>
                </tr>
              ) : (
                filteredSpas.map((spa) => (
                  <tr key={spa.id} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <p className="text-foreground font-bold group-hover:text-primary transition-colors">{spa.name}</p>
                          <p className="text-foreground/40 text-xs">ID: {spa.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-foreground/80 text-sm">{spa.email}</p>
                      <p className="text-foreground/40 text-xs">{spa.phone || 'Sin teléfono'}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-foreground/60">
                      {new Date(spa.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        spa.active 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {spa.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {spa.active ? 'Activo' : 'Suspendido'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(spa)}
                          title="Editar Spa"
                          className="p-2.5 text-foreground/40 border border-foreground/10 hover:bg-foreground/5 hover:text-foreground rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(spa)}
                          title={spa.active ? 'Desactivar Spa' : 'Activar Spa'}
                          className={`p-2.5 rounded-xl border transition-all ${
                            spa.active 
                            ? 'text-red-400 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20' 
                            : 'text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20'
                          }`}
                        >
                          <Power size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(spa.id)}
                          title="Eliminar (Soft Delete)"
                          className="p-2.5 text-foreground/40 border border-foreground/10 hover:bg-foreground/5 hover:text-foreground rounded-xl transition-all"
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

      <NewSpaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSpas}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!spaToDelete}
        onClose={() => setSpaToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Spa"
        description="¿Estás seguro de que deseas eliminar este Spa? Se realizará un Soft Delete, pero el Spa perderá acceso a la plataforma."
        isProcessing={isDeleting}
      />

      {/* Edit Spa Modal */}
      <EditSpaModal
        isOpen={!!editingSpa}
        onClose={() => setEditingSpa(null)}
        spa={editingSpa}
        onSuccess={fetchSpas}
      />
    </div>
  );
}
