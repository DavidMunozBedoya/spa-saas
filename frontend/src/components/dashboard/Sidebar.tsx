"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import api from '@/lib/api';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Building2, 
  Calendar,
  Briefcase,
  TrendingUp,
  Facebook,
  Instagram,
  Phone,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePermissions } from "@/hooks/usePermissions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", reqPermission: null },
  { icon: TrendingUp, label: "Reportes", href: "/dashboard/reports", reqPermission: "reports:view" },
  { icon: Users, label: "Personal", href: "/dashboard/staff", reqPermission: "staff:view" },
  { icon: ShieldCheck, label: "Accesos", href: "/dashboard/users", reqPermission: "users:manage" },
  { icon: Briefcase, label: "Servicios", href: "/dashboard/services", reqPermission: "services:view" },
  { icon: Calendar, label: "Citas", href: "/dashboard/appointments", reqPermission: "appointments:view" },
  { icon: Settings, label: "Configuración", href: "/dashboard/settings", reqPermission: "spa:config" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [spaConfig, setSpaConfig] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { hasPermission, loading: permsLoading } = usePermissions();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/spas/settings");
        if (response.data) {
          setSpaConfig(response.data);
        }
      } catch (error) {
        console.error("Error fetching spa config:", error);
      }
    };
    fetchConfig();

    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (permsLoading) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "h-[100dvh] glass border-r border-foreground/10 flex flex-col fixed lg:relative left-0 top-0 z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("p-4 shrink-0 flex items-center justify-between", isCollapsed && "px-3 justify-center")}>
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            {spaConfig?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={spaConfig.logo_url} 
                alt="Spa Logo" 
                className="h-10 w-auto max-w-[140px] rounded-xl object-contain py-1 shrink-0" 
                onError={(e) => (e.currentTarget.style.display = 'none')} 
              />
            ) : (
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="text-primary w-6 h-6" />
            </div>
          )}
        </div>

        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex p-1.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all",
            isCollapsed && "bg-foreground/5 text-foreground"
          )}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={cn("flex-1 px-4 space-y-1 mt-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent", isCollapsed && "px-2")}>
        {menuItems.map((item) => {
          // Filtrado RBAC: Si requiere permiso y no lo tiene, no renderizar
          if (item.reqPermission && !hasPermission(item.reqPermission)) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                isCollapsed && "px-0 py-3 justify-center",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-primary-foreground" : "text-primary/70 group-hover:text-primary")} />
              <span className={cn("font-medium transition-all duration-300", isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100 uppercase text-xs tracking-widest")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className={cn("p-4 border-t border-foreground/10", isCollapsed && "px-2")}>
          <button 
              onClick={handleLogout}
              className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all",
                  isCollapsed && "justify-center px-0"
              )}
          >
              <LogOut size={20} />
              {!isCollapsed && <span className="font-medium uppercase text-xs tracking-widest">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
