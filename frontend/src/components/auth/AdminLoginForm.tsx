"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { ShieldAlert, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/platform/login", data);
      
      if (response.data.token) {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("¡Acceso Global Autorizado!");
        
        // Redirigir al panel SuperAdmin
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Error al iniciar sesión en plataforma";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass p-8 rounded-3xl border border-red-500/20 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Portal SuperAdmin</h1>
        <p className="text-red-400/80 text-center mt-2 text-sm px-4">
          Acceso Restringido. Sistema Central de Gestión.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">Correo de Plataforma</label>
          <div className="relative">
            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
            <input
              {...register("email")}
              type="email"
              placeholder="admin@plataforma.com"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
              className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : ''} rounded-xl focus:outline-none focus:ring-1 transition-all placeholder:text-foreground/30 text-foreground`}
              onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-foreground/80">Contraseña de Seguridad</label>
          </div>
          <div className="relative">
            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
              className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : ''} rounded-xl focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-foreground/30`}
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
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Autenticando...
            </>
          ) : (
            "Ingresar a Plataforma"
          )}
        </button>
      </form>
    </div>
  );
}
