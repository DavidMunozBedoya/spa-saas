"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Settings, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Clock, 
  Image as ImageIcon,
  Upload,
  Facebook,
  Instagram,
  Save,
  Loader2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const FIELD_NAMES: Record<string, string> = {
  name: "Nombre del Spa",
  email: "Correo Electrónico",
  phone: "Teléfono",
  address: "Dirección",
  timezone: "Zona Horaria",
  description: "Descripción",
  logo_url: "Logo",
  website: "Sitio Web",
  facebook_url: "Facebook",
  instagram_url: "Instagram",
};

export default function SpaSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    timezone: "",
    description: "",
    logo_url: "",
    website: "",
    facebook_url: "",
    instagram_url: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/spas/settings");
      
      const spaData = response.data;
      setFormData({
        name: spaData.name || "",
        email: spaData.email || "",
        phone: spaData.phone || "",
        address: spaData.address || "",
        timezone: spaData.timezone || "UTC",
        description: spaData.description || "",
        logo_url: spaData.logo_url || "",
        website: spaData.website || "",
        facebook_url: spaData.facebook_url || "",
        instagram_url: spaData.instagram_url || "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar configuración del Negocio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("La imagen no debe pesar más de 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = { ...formData };
      
      // Limpiar strings vacíos para evitar errores 400 en campos opcionales/URL
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string' && payload[key].trim() === "") {
          payload[key] = null;
        } else if (typeof payload[key] === 'string') {
          let val = payload[key].trim();
          // Autocompletar https:// en enlaces si el usuario lo omitió
          if (['website', 'facebook_url', 'instagram_url'].includes(key) && val && !/^https?:\/\//i.test(val)) {
            val = 'https://' + val;
          }
          payload[key] = val;
        }
      });
      
      await api.patch("/spas/settings", payload);
      
      toast.success("Configuración actualizada correctamente");
      
      // Delay reload to allow toast to be seen
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      const errData = error.response?.data;
      if (errData?.errors && errData.errors.length > 0) {
        const firstError = errData.errors[0];
        const fieldName = FIELD_NAMES[firstError.path] || firstError.path;
        toast.error(`${fieldName}: ${firstError.message}`);
        console.error("Validation Errors:", errData.errors);
      } else {
        toast.error(errData?.error || errData?.message || "Error al guardar los cambios");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <PermissionGuard permission="spa:config">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <Settings className="text-primary" size={32} />
            Configuración del establecimiento
          </h1>
          <p className="text-muted-foreground-auto mt-2 font-medium">
            Administra la información pública y perfil operativo de tu negocio.
          </p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Main Info */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="text-primary" size={18} /> Información General
            </h2>
            
            <div className="grid grid-cols-1 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1 flex items-center gap-2">Nombre del establecimiento <span className="text-[9px] bg-foreground/10 px-1.5 py-0.5 rounded text-foreground/40">Solo Lectura</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    name="name" value={formData.name} onChange={handleChange} required
                    disabled
                    title="Definido por SuperAdmin"
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white/50 cursor-not-allowed select-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1 flex items-center gap-2">Contacto Principal (Email) <span className="text-[9px] bg-foreground/10 px-1.5 py-0.5 rounded text-foreground/40">Solo Lectura</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    disabled
                    title="Definido por SuperAdmin"
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white/50 cursor-not-allowed select-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    name="phone" value={formData.phone} onChange={handleChange}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-foreground/20"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1 flex items-center gap-2">Zona Horaria <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/40">Solo Lectura</span></label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    name="timezone" value={formData.timezone} onChange={handleChange}
                    disabled
                    title="Definido por SuperAdmin"
                    placeholder="America/Bogota"
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white/50 cursor-not-allowed select-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Dirección Física</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-foreground/30" size={16} />
                  <textarea 
                    name="address" value={formData.address} onChange={handleChange} rows={2}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-foreground/20 resize-none text-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Descripción del Negocio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-foreground/30" size={16} />
                  <textarea 
                    name="description" value={formData.description} onChange={handleChange} rows={3}
                    placeholder="Breve reseña sobre los servicios y la visión de tu Spa..."
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-foreground/20 resize-none text-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column - Media & Socials */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="text-primary" size={18} /> Redes Sociales
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Logo del Spa (Máx 2MB)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload} 
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="w-full flex items-center justify-between pl-4 pr-1 py-1 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-all">
                    <span className="text-white/50 text-sm flex items-center gap-2">
                       <ImageIcon size={16} /> {formData.logo_url?.startsWith("data:image") ? "Imagen cargada localmente" : (formData.logo_url || "Seleccionar archivo desde el ordenador")}
                    </span>
                    <div className="bg-primary text-white p-2 text-xs font-bold rounded-lg flex items-center gap-2">
                      <Upload size={14} /> Subir
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Sitio Web</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                  <input 
                    type="text" name="website" value={formData.website} onChange={handleChange} placeholder="www.mispa.com"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground text-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Facebook</label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                  <input 
                    type="text" name="facebook_url" value={formData.facebook_url} onChange={handleChange} placeholder="facebook.com/mispa"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground text-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Instagram</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                  <input 
                    type="text" name="instagram_url" value={formData.instagram_url} onChange={handleChange} placeholder="instagram.com/mispa"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground text-sm"
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>
            </div>

            {/* Logo Preview snippet */}
            {formData.logo_url && (
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.logo_url} alt="Logo Preview" className="max-h-24 object-contain rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </PermissionGuard>
  );
}
