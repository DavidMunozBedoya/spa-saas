"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Función de validación de ruta
    const authCheck = () => {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");
      
      const publicPaths = ["/login", "/admin-login", "/", "/forgot-password", "/reset-password"];
      const isPublicPath = publicPaths.includes(pathname);
      
      // Robust detection for protected paths
      const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
      const isDashboardPath = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

      if (!token && (isAdminPath || isDashboardPath)) {
        setAuthorized(false);
        router.push("/login");
      } else if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Si intenta entrar a admin pero no es admin de plataforma
        if (isAdminPath && !user.isPlatformAdmin) {
             router.push("/dashboard");
             return;
        }
        
        setAuthorized(true);
      } else if (isPublicPath) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.push("/login");
      }
    };

    authCheck();

    // Opcional: Escuchar cambios en el almacenamiento para sincronizar pestañas si se desea,
    // pero aquí preferimos el aislamiento por sessionStorage.
  }, [pathname, router]);

  const isProtectedPath = pathname.startsWith("/dashboard") || (pathname.startsWith("/admin") && pathname !== "/admin-login");
  if (!authorized && isProtectedPath) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
        <p className="text-foreground/50 font-bold tracking-widest uppercase animate-pulse">Verificando Seguridad...</p>
      </div>
    );
  }

  return <>{children}</>;
}
