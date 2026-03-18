import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, Loader2, Save, Key, UserCheck, Shield, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface NewUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  spaId: string;
  editData?: any | null;
}

export default function NewUserModal({ onClose, onSuccess, spaId, editData }: NewUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [allSystemPermissions, setAllSystemPermissions] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [togglingPermission, setTogglingPermission] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role_ids: [3] as number[], // Terapeuta por defecto
    staff_id: ""
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        full_name: editData.full_name || "",
        email: editData.email || "",
        password: "", // Contraseña vacía por defecto al editar
        role_ids: editData.role_ids || [3],
        staff_id: editData.staff_id || ""
      });
      fetchUserPermissions(editData.id);
    }

    // Fetch staff and system permissions
    const fetchData = async () => {
      try {
        const [staffRes, permListRes] = await Promise.all([
          api.get("/staff"),
          api.get("/users/permissions/list")
        ]);
        setStaffList(staffRes.data);
        setAllSystemPermissions(permListRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const fetchUserPermissions = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}/permissions`);
      setUserPermissions(response.data.permissions || []);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
  };

  const handlePermissionToggle = async (code: string, isCurrentlyGranted: boolean) => {
    if (!editData) {
      toast.info("Guarda el usuario primero para ajustar permisos específicos");
      return;
    }

    try {
      setTogglingPermission(code);
      const action = isCurrentlyGranted ? "revoke" : "grant";
      await api.post(`/users/${editData.id}/permissions/${action}`, { permission_code: code });
      
      setUserPermissions(prev => 
        isCurrentlyGranted ? prev.filter(p => p !== code) : [...prev, code]
      );
      toast.success(`Permiso ${isCurrentlyGranted ? 'revocado' : 'concedido'}`);
    } catch (error) {
      toast.error("Error al actualizar permiso");
    } finally {
      setTogglingPermission(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => {
      const isSelected = prev.role_ids.includes(roleId);
      if (isSelected && prev.role_ids.length === 1) {
        toast.error("Debe seleccionar al menos un rol");
        return prev;
      }
      return {
        ...prev,
        role_ids: isSelected 
          ? prev.role_ids.filter(id => id !== roleId)
          : [...prev.role_ids, roleId]
      };
    });
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStaffId = e.target.value;
    setFormData(prev => ({ ...prev, staff_id: selectedStaffId }));
    
    // Auto-fill full_name and email if a staff member is selected and fields are empty
    if (selectedStaffId) {
      const selectedStaff = staffList.find(s => s.id === selectedStaffId);
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          full_name: prev.full_name || selectedStaff.full_name,
          email: prev.email || (selectedStaff.email || "")
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = { 
        spa_id: spaId,
        full_name: formData.full_name,
        email: formData.email,
        role_ids: formData.role_ids
      };
      
      // En modo edición solo enviamos password si el usuario escribió algo
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editData) {
        toast.error("La contraseña es obligatoria para nuevos accesos");
        setIsSubmitting(false);
        return;
      }

      if (formData.staff_id) {
        payload.staff_id = formData.staff_id;
      } else {
        payload.staff_id = null; // explícitamente null
      }

      if (editData) {
        await api.patch(`/users/${editData.id}`, payload);
        toast.success("Credenciales actualizadas exitosamente");
      } else {
        await api.post("/users", payload);
        toast.success("Credenciales de acceso creadas exitosamente");
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al crear el acceso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background/95 border border-foreground/10 rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 border-b border-foreground/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
              <Key className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight italic">
                {editData ? "Editar Acceso" : "Otorga Acceso"}
              </h2>
              <p className="text-xs text-foreground/50 font-medium">
                {editData ? "Modifica los roles y datos de la cuenta" : "Genera credenciales para el sistema"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Vincular al Perfil (Opcional)</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                  <select 
                    name="staff_id" 
                    value={formData.staff_id} 
                    onChange={handleStaffChange}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground appearance-none shadow-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  >
                    <option value="" className="bg-background text-foreground">Ninguno (Libre)</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id} className="bg-background text-foreground">
                        {staff.full_name} {staff.identification_number ? `(ID: ${staff.identification_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-foreground/40 px-1 mt-1">Enlaza este Login a un Terapeuta.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Nombre Descriptivo <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    required
                    placeholder="Nombre para el sistema"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Correo de Acceso <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    required
                    autoComplete="none"
                    placeholder="empleado@spa.com"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Contraseña Segura {!editData && <span className="text-red-400">*</span>}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange}
                    required={!editData}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={editData ? "Dejar en blanco para conservar" : "Mínimo 8 caracteres"}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-foreground placeholder:text-foreground/20"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 sm:col-span-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Roles Asignados <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ...(formData.role_ids.includes(1) ? [{ id: 1, name: "Propietario", desc: "Acceso Maestro (Protegido)" }] : []),
                    { id: 2, name: "Administrador", desc: "Control Total Secundario" },
                    { id: 4, name: "Recepcionista", desc: "Agenda y Facturación" },
                    { id: 3, name: "Terapeuta", desc: "Solo Agenda Médica" }
                  ].map(role => {
                    const isSelected = formData.role_ids.includes(role.id);
                    const isProtected = role.id === 1;
                    
                    return (
                      <div 
                        key={role.id}
                        onClick={() => !isProtected && handleRoleToggle(role.id)}
                        className={`p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          !isProtected ? 'cursor-pointer' : 'cursor-not-allowed opacity-90 grayscale-[0.3]'
                        } ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                            : 'bg-foreground/5 border-foreground/10 hover:border-foreground/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {role.name}
                          </span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary border-primary' : 'border-foreground/30 bg-background'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-foreground/50">{role.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/*Sección de Permisos Dinámicos */}
              <div className="sm:col-span-2 space-y-4 pt-4 border-t border-foreground/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                    <Shield className="text-amber-500 w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Ajuste Fino de Permisos</h3>
                    <p className="text-[10px] text-foreground/40 font-medium lowercase">Sobreescribe los permisos por defecto de los roles seleccionados</p>
                  </div>
                </div>

                {!editData ? (
                  <div className="p-4 bg-foreground/5 rounded-2xl border border-foreground/10 text-center">
                    <p className="text-xs text-foreground/50 italic">Crea el usuario para habilitar el control granular de permisos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allSystemPermissions
                      .filter(p => p.code !== 'platform:manage')
                      .map(perm => {
                        const isGranted = userPermissions.includes(perm.code);
                        const isToggling = togglingPermission === perm.code;

                        return (
                          <div key={perm.code} className="p-3 bg-foreground/5 rounded-2xl border border-foreground/5 flex flex-col gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">
                                {perm.code.split(':').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </span>
                              <span className="text-[9px] text-foreground/40 leading-tight line-clamp-1">{perm.description}</span>
                            </div>
                            
                            <div className={`flex items-center gap-2 bg-background/50 p-1 rounded-xl self-start ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}>
                              <button
                                type="button"
                                onClick={() => !isGranted && handlePermissionToggle(perm.code, false)}
                                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                                  isGranted ? 'bg-emerald-500 text-white shadow-sm' : 'text-foreground/40 hover:text-foreground/60'
                                }`}
                              >
                                Permitir
                              </button>
                              <button
                                type="button"
                                onClick={() => isGranted && handlePermissionToggle(perm.code, true)}
                                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                                  !isGranted ? 'bg-red-500 text-white shadow-sm' : 'text-foreground/40 hover:text-foreground/60'
                                }`}
                              >
                                Bloquear
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>

            <div className="pt-2 flex gap-3 border-t border-foreground/10 mt-2 shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-xl border border-foreground/10 transition-all text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    {editData ? "Actualizar Accesos" : "Crear Accesos"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
