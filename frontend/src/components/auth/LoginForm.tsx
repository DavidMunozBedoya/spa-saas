"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Detectar si el usuario fue redirigido por el interceptor debido a sesión expirada
    if (searchParams.get("expired") === "true") {
      toast.error("Tu sesión ha caducado por seguridad. Por favor, ingresa de nuevo.");
    }
  }, [searchParams]);

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
      const response = await api.post("/auth/login", data);
      
      if (response.data.token) {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("¡Bienvenid@!");
        
        // Redirigir al panel del Spa
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Error al iniciar sesión";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Inicia Sesión</h1>
        <p className="text-foreground/60 text-center mt-2 text-sm px-4">
          Accede al panel de administración de tu negocio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">Correo Electrónico</label>
          <div className="relative">
            <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 rotate-90" size={18} />
            <input
              {...register("email")}
              type="email"
              placeholder="correo@ejemplo.com"
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
            <label className="block text-sm font-medium text-foreground/80">Contraseña</label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-primary/60 hover:text-primary transition-colors pr-1"
            >
              ¿Olvidaste tu contraseña?
            </Link>
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
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Accediendo...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </button>
      </form>
    </div>
  );
}
