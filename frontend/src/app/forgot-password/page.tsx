"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      await api.post("/auth/recovery/request", data);
      setIsSent(true);
      toast.success("Instrucciones enviadas correctamente");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al solicitar recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-md glass p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Mail className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Recuperar Contraseña</h1>
          <p className="text-foreground/60 text-center mt-2 text-sm px-4">
            Ingresa tu correo y te enviaremos las instrucciones para restablecer tu acceso.
          </p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <CheckCircle2 className="text-emerald-500 w-16 h-16" />
            </div>
            <p className="text-white/80 font-medium">
              ¡Listo! Si el correo está registrado, recibirás un mensaje en unos minutos.
            </p>
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground/80">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Enviar Instrucciones"}
            </button>

            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 text-foreground/40 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver al Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
