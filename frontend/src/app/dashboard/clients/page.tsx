"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Contact, 
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
  EyeOff,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import ClientDetailsModal from "@/components/dashboard/ClientDetailsModal";
import ClientFormModal from "@/components/dashboard/ClientFormModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [viewingClient, setViewingClient] = useState<any | null>(null);
  
  const [clientToDelete, setClientToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = usePermissions();
  const hasManageClients = hasPermission("clients:manage");

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/clients", { params: { includeArchived: "true" } });
      setClients(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar los clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteRequest = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const handleArchive = handleDeleteRequest;

  const handleReactivate = async (id: string) => {
    try {
      await api.patch(`/clients/${id}/restore`);
      toast.success("Cliente restaurado exitosamente");
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al restaurar al cliente");
    }
  };

  const executeDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      toast.success("Cliente archivado exitosamente");
      setClientToDelete(null);
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al archivar al cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (client: any) => {
    setIsDetailsOpen(false);
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleOpenNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (client: any) => {
    setViewingClient(client);
    setIsDetailsOpen(true);
  };

  const handleArchiveFromDetails = () => {
    if (viewingClient) {
      setIsDetailsOpen(false);
      handleArchive(viewingClient.id, viewingClient.full_name);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.identity_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = showInactive ? true : c.active === true;

    return matchesSearch && matchesStatus;
  });

  return (
    <PermissionGuard permission="clients:view">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 sm:px-4">
        
        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight italic">
              <Contact className="text-primary" size={32} />
              Base de Clientes
            </h1>
            <p className="text-muted-foreground-auto mt-1 font-medium uppercase text-[10px] tracking-widest">
              Consulta y administra las fichas de tus clientes
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente..."
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
              {showInactive ? "Viendo Todo" : "Ver Archivados"}
            </button>

            {hasManageClients && (
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

        {/* Clients List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-foreground/10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
              <Contact className="text-foreground/30 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron clientes</h3>
            <p className="text-foreground/50 max-w-md">
              {searchQuery 
                ? "Prueba buscar con otro nombre o número de identificación." 
                : "Los clientes se registran automáticamente al agendar citas, o puedes agregarlos manualmente."}
            </p>
            {!searchQuery && hasManageClients && (
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
                    <th className="p-4 font-black pl-6">Cliente</th>
                    <th className="p-4 font-black">Identificación</th>
                    <th className="p-4 font-black">Contacto</th>
                    <th className="p-4 font-black">Estado</th>
                    <th className="p-4 font-black text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      onClick={() => handleViewDetails(client)}
                      className="group hover:bg-foreground/5 transition-colors cursor-pointer"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
                            {client.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{client.full_name}</p>
                            {client.birth_date && (
                              <p className="text-[10px] text-foreground/40 mt-0.5">
                                Nac. {new Date(client.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {client.identity_number ? (
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-foreground/30" />
                            <span className="text-sm font-medium text-foreground/70">{client.identity_number}</span>
                          </div>
                        ) : (
                          <span className="text-foreground/30 text-[10px] italic uppercase tracking-widest">Sin registrar</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {client.email ? (
                             <div className="flex items-center gap-2 text-foreground/80 font-medium">
                               <Mail size={12} className="text-foreground/40" />
                               {client.email}
                             </div>
                          ) : null}
                          {client.phone ? (
                            <div className="flex items-center gap-2 text-foreground/80 font-medium">
                               <Phone size={12} className="text-foreground/40" />
                               {client.phone}
                             </div>
                          ) : null}
                          {!client.email && !client.phone && (
                            <span className="text-foreground/40 text-[10px] italic">Sin contacto registrado</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          client.active 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {client.active ? <CheckCircle2 size={12} /> : <Archive size={12} />}
                          {client.active ? 'Activo' : 'Archivado'}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {hasManageClients && (
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {!client.active ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleReactivate(client.id); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest" 
                                title="Restaurar"
                              >
                                <RefreshCcw size={14} />
                                Restaurar
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(client); }} 
                                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors" 
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleArchive(client.id, client.full_name); }} 
                                  className="p-2 text-foreground/40 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" 
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

        {isDetailsOpen && viewingClient && (
          <ClientDetailsModal 
            client={viewingClient}
            onClose={() => setIsDetailsOpen(false)}
            onEdit={hasManageClients ? () => handleEdit(viewingClient) : undefined}
            onArchive={hasManageClients ? handleArchiveFromDetails : undefined}
            onReactivate={hasManageClients ? async () => {
              await handleReactivate(viewingClient.id);
              setIsDetailsOpen(false);
            } : undefined}
          />
        )}

        {isFormOpen && (
          <ClientFormModal 
            onClose={() => setIsFormOpen(false)} 
            onSuccess={() => {
              setIsFormOpen(false);
              fetchClients();
            }}
            editData={editingClient}
          />
        )}

        <ConfirmModal
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirm={executeDelete}
          title="Archivar Cliente"
          description={`¿Estás seguro de que deseas archivar a "${clientToDelete?.name}"? No se eliminará su historial de citas ni facturas. Podrás restaurarlo en cualquier momento desde la vista "Ver Archivados".`}
          isProcessing={isDeleting}
        />

      </div>
    </PermissionGuard>
  );
}
