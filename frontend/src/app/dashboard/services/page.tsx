"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Sparkles, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2, 
  Clock, 
  DollarSign 
} from "lucide-react";
import { toast } from "sonner";
import NewServiceModal from "@/components/dashboard/NewServiceModal";
import ServiceDetailsModal from "@/components/dashboard/ServiceDetailsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [viewingService, setViewingService] = useState<any | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/services");
      setServices(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar los servicios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userDataStr = sessionStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.permissions) setUserPermissions(userData.permissions);
        else if (userData.role === "SUPER_ADMIN") setUserPermissions(["platform:manage"]);
      } catch (e) {}
    }
    fetchServices();
  }, []);

  const hasManageServices = userPermissions.includes("services:manage") || userPermissions.includes("platform:manage");

  const handleDeleteRequest = (id: string, name: string) => {
    setServiceToDelete({ id, name });
  };

  const executeDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    
    try {
      await api.delete(`/services/${serviceToDelete.id}`);
      toast.success("Servicio eliminado exitosamente");
      setServiceToDelete(null);
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar el servicio");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (service: any) => {
    setIsDetailsOpen(false);
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (service: any) => {
    setViewingService(service);
    setIsDetailsOpen(true);
  };

  const handleDeleteFromDetails = () => {
    if (viewingService) {
      setIsDetailsOpen(false);
      handleDeleteRequest(viewingService.id, viewingService.name);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <Sparkles className="text-primary" size={32} />
            Menú de Servicios
          </h1>
          <p className="text-muted-foreground-auto mt-1 font-medium">
            Administra el catálogo de tus servicios y precios.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
            <input 
              type="text" 
              placeholder="Buscar servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/20"
            />
          </div>
          {hasManageServices && (
            <button 
              onClick={handleOpenNew}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Plus size={20} />
              Nuevo Servicio
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="glass rounded-3xl p-12 border border-foreground/10 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="text-foreground/30 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron servicios</h3>
          <p className="text-foreground/50 max-w-md">
            {searchQuery 
              ? "Prueba buscar con otro término en la barra de búsqueda." 
              : "Comienza agregando el primer tratamiento o servicio en el catálogo de tu Spa."}
          </p>
          {!searchQuery && hasManageServices && (
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
                <tr className="border-b border-foreground/10 bg-foreground/5 text-xs uppercase tracking-widest text-foreground/50">
                  <th className="p-4 font-bold pl-6">Servicio</th>
                  <th className="p-4 font-bold">Duración</th>
                  <th className="p-4 font-bold">Precio</th>
                  <th className="p-4 font-bold text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filteredServices.map((service) => (
                  <tr 
                    key={service.id} 
                    onClick={() => handleViewDetails(service)}
                    className="group hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-bold text-foreground">{service.name}</p>
                      {service.description && (
                         <p className="text-xs text-foreground/50 truncate max-w-xs">{service.description}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-primary/80 text-sm font-semibold">
                        <Clock size={14} />
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </td>
                    <td className="p-4 text-emerald-400 font-bold">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(service.price))}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {hasManageServices && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(service); }} 
                            className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(service.id, service.name); }} 
                            className="p-2 text-foreground/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {isDetailsOpen && viewingService && (
        <ServiceDetailsModal 
          service={viewingService}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={hasManageServices ? () => handleEdit(viewingService) : undefined}
          onDelete={hasManageServices ? handleDeleteFromDetails : undefined}
        />
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <NewServiceModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchServices();
          }}
          editData={editingService}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={executeDelete}
        title="Eliminar Servicio"
        description={`¿Estás seguro de que deseas eliminar permanentemente el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
        isProcessing={isDeleting}
      />

    </div>
  );
}
