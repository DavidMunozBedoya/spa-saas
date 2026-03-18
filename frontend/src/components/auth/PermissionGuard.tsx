"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface PermissionGuardProps {
  permission?: string;
  allPermissions?: string[];
  anyPermission?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  allPermissions, 
  anyPermission, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <p className="text-foreground/40 text-xs font-black uppercase tracking-widest animate-pulse">Verificando Credenciales...</p>
      </div>
    );
  }

  let isAuthorized = true;

  if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (allPermissions) {
    isAuthorized = hasAllPermissions(allPermissions);
  } else if (anyPermission) {
    isAuthorized = hasAnyPermission(anyPermission);
  }

  if (!isAuthorized) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2 italic">Acceso Restringido</h2>
        <p className="text-muted-foreground-auto max-w-md font-medium">
          No tienes los permisos necesarios para realizar esta acción o ver este contenido. 
          Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
