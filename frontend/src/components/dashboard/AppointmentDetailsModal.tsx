"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  UserStar,
  Scissors, 
  TowelRack,
  Trash2, 
  Edit3, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  Receipt,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { usePermissions } from "@/hooks/usePermissions";

interface AppointmentDetailsModalProps {
  appointmentId: string;
  onClose: () => void;
  onEdit?: (appointment: any) => void;
  onSuccess: () => void;
  canEdit?: boolean;
}

export default function AppointmentDetailsModal({ 
  appointmentId, 
  onClose, 
  onEdit,
  onSuccess,
  canEdit = false
}: AppointmentDetailsModalProps) {
  const { hasPermission, loading: permsLoading } = usePermissions();
  
  const canLiquidar = hasPermission("invoices:manage");
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showLiquidation, setShowLiquidation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [isLiquidating, setIsLiquidating] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState<any>(null);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment(response.data);
      console.log(response.data);
    } catch (error: any) {
      toast.error("Error al cargar los detalles de la cita");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [appointmentId]);

  const handleCancelAppointment = async () => {
    try {
      setIsDeleting(true);
      await api.patch(`/appointments/${appointmentId}/status`, { status: "CANCELLED" });
      toast.success("Cita cancelada correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cancelar la cita");
    } finally {
      setIsDeleting(false);
      setShowConfirmCancel(false);
    }
  };

  const handleLiquidate = async () => {
    try {
      setIsLiquidating(true);
      const response = await api.post(`/invoices/liquidate`, { 
        appointment_id: appointmentId,
        payment_method: paymentMethod,
        notes: "Liquidación desde el dashboard"
      });
      
      setInvoiceCreated(response.data);
      toast.success("Liquidación exitosa y factura generada");
      onSuccess();
      // No cerramos el modal inmediatamente para permitir la descarga del PDF
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al liquidar la cita");
    } finally {
      setIsLiquidating(false);
    }
  };

  const downloadPDF = async () => {
    if (!invoiceCreated) return;
    try {
      const response = await api.get(`/invoices/${invoiceCreated.id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Factura-${invoiceCreated.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Error al descargar el PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass p-8 rounded-3xl flex flex-col items-center gap-4 border border-foreground/10">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-foreground font-medium">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const totalCost = appointment.services?.reduce((acc: number, s: any) => acc + Number(s.price), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background w-full max-w-3xl rounded-[2.5rem] border border-foreground/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        
        {/* Header Visual */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-end p-8">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all z-10"
            >
                <X size={20} />
            </button>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Calendar className="text-primary-foreground" size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Resumen de Cita</h2>
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mt-1",
                        appointment.status === 'BOOKED' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        appointment.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        {appointment.status === 'BOOKED' && <Clock size={12} />}
                        {appointment.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        {appointment.status === 'CANCELLED' && <AlertCircle size={12} />}
                        {appointment.status}
                    </span>
                </div>
            </div>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* LEFT: Main Info */}
                <div className="md:col-span-7 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Cliente</label>
                            <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                                <User size={18} className="text-primary/60 shrink-0" />
                                <span className="text-sm font-bold text-foreground truncate">{appointment.client_name}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Profesional</label>
                            <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                                <UserStar size={18} className="text-primary/60 shrink-0" />
                                <span className="text-sm font-bold text-foreground truncate">{appointment.staff_name}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Día</label>
                            <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                                <Calendar size={18} className="text-primary/60 shrink-0" />
                                <span className="text-sm font-bold text-foreground">
                                    {startTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Horario</label>
                            <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-foreground/10 rounded-2xl">
                                <Clock size={18} className="text-primary/60 shrink-0" />
                                <span className="text-sm font-bold text-foreground">
                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-foreground/5 border border-foreground/10 rounded-[2rem] space-y-4">
                        <h4 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Acciones Disponibles</h4>
                        <div className="flex items-center gap-3">
                            {appointment.status === 'BOOKED' ? (
                                canEdit ? (
                                    <>
                                        {onEdit && (
                                            <button 
                                                onClick={() => onEdit(appointment)}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground font-bold hover:bg-foreground/10 hover:border-foreground/20 transition-all active:scale-[0.98]"
                                            >
                                                <Edit3 size={18} />
                                                Editar
                                            </button>
                                        )}
                                        {canLiquidar && (
                                            <button 
                                                onClick={() => setShowLiquidation(true)}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
                                            >
                                                <Receipt size={18} />
                                                Liquidar
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setShowConfirmCancel(true)}
                                            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-[0.2em] italic w-full text-center py-2 border border-dashed border-foreground/10 rounded-xl">
                                        Solo lectura
                                    </p>
                                )
                            ) : (
                                <button 
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center py-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground/60 font-bold hover:bg-foreground/10 transition-all"
                                >
                                    Cerrar Resumen
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Services & Total */}
                <div className="md:col-span-5 flex flex-col space-y-6">
                    <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em] pl-1">Servicios Solicitados</label>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {appointment.services?.map((service: any) => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-foreground/5 border border-foreground/10 rounded-2xl group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <TowelRack size={14} className="text-primary/60" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/80 line-clamp-1">{service.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-primary ml-2 shrink-0">${Number(service.price).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] shadow-xl shadow-foreground/5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Inversión Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-foreground italic tracking-tighter">${totalCost.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-foreground/40 uppercase">COP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Overlay de Liquidación */}
        {showLiquidation && !invoiceCreated && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                <div className="w-full max-w-sm space-y-8 text-center">
                    <div className="space-y-2 shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shrink-0 shadow-xl shadow-emerald-500/10">
                            <Receipt className="text-emerald-400" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-foreground italic tracking-tight">Cerrar y Liquidar</h3>
                        <p className="text-foreground/60 text-sm font-medium">Selecciona el método de pago para finalizar la cita de <span className="text-foreground font-bold">{appointment.client_name}</span>.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'EFECTIVO', icon: Banknote, label: 'Efectivo' },
                                { id: 'TARJETA', icon: CreditCard, label: 'Tarjeta' },
                                { id: 'TRANSFERENCIA', icon: Receipt, label: 'Transf.' }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    style={{ backgroundColor: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--input-bg)', borderColor: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--input-border)' }}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 group",
                                        paymentMethod === method.id 
                                            ? "shadow-lg shadow-primary/20 scale-105" 
                                            : "hover:bg-foreground/5"
                                    )}
                                >
                                    <method.icon size={20} className={cn(
                                        paymentMethod === method.id ? "text-primary-foreground" : "text-white/40 group-hover:text-white"
                                    )} />
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        paymentMethod === method.id ? "text-primary-foreground" : "text-foreground/40 group-hover:text-foreground/60"
                                    )}>{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full shrink-0">
                        <button
                            onClick={handleLiquidate}
                            disabled={isLiquidating}
                            className="w-full py-5 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-3xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
                        >
                            {isLiquidating ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Confirmar Pago de ${totalCost.toLocaleString()}
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowLiquidation(false)}
                            className="w-full py-4 text-foreground/40 font-bold hover:text-foreground transition-all text-sm"
                        >
                            Volver al resumen
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Pantalla de Éxito y Factura */}
        {invoiceCreated && (
            <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500 text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 animate-bounce delay-300">
                    <CheckCircle2 className="text-black" size={48} />
                </div>
                
                <div className="space-y-2 mb-10">
                    <h2 className="text-3xl font-black text-foreground italic tracking-tighter uppercase">¡Servicio Completado!</h2>
                    <p className="text-emerald-400/80 font-bold text-sm tracking-widest uppercase">Factura {invoiceCreated.invoice_number}</p>
                </div>

                <div className="grid grid-cols-1 w-full max-w-xs gap-4">
                    <button
                        onClick={downloadPDF}
                        className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        <Download size={20} />
                        Descargar Factura
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-foreground/5 border border-foreground/10 text-foreground font-black uppercase tracking-widest rounded-3xl hover:bg-foreground/10 transition-all"
                    >
                        Cerrar y Finalizar
                    </button>
                </div>
            </div>
        )}
      </div>

      {showConfirmCancel && (
        <ConfirmModal 
          isOpen={showConfirmCancel}
          onClose={() => setShowConfirmCancel(false)}
          onConfirm={handleCancelAppointment}
          title="¿Cancelar Cita?"
          description={`¿Estás seguro que deseas cancelar la cita de ${appointment.client_name}? Esta acción liberará el espacio en la agenda.`}
          confirmText="Sí, Cancelar Cita"
          cancelText="No, Mantener"
          isProcessing={isDeleting}
        />
      )}
    </div>
  );
}
