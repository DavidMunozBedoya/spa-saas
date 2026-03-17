"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Building2, 
  Calendar,
  Briefcase,
  TrendingUp,
  Facebook,
  Instagram,
  Phone,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Check local permissions
    const userDataStr = sessionStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.permissions) {
          setUserPermissions(userData.permissions);
        } else if (userData.role === "SUPER_ADMIN") {
          setUserPermissions(["platform:manage"]);
        } else {
          // Si no tiene permisos cacheados pero es usuario, desloguearlo para que recargue el payload
          handleLogout();
        }
      } catch (e) {
        console.error("Error parsing user data");
      }
    }

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
          if (item.reqPermission && !userPermissions.includes(item.reqPermission)) {
            // Nota: El SUPER_ADMIN global no usa este Dashboard, pero si lo usara, pasaría libre
            if (!userPermissions.includes("platform:manage")) return null;
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
        {spaConfig && (spaConfig.facebook_url || spaConfig.instagram_url || spaConfig.phone) && (
          <div className={cn(
            "border-t border-foreground/10 bg-foreground/5 transition-all duration-300",
            isCollapsed ? "px-2 py-3 flex flex-col items-center gap-2" : "px-6 py-4 space-y-3"
          )}>
            {!isCollapsed && <p className="text-[10px] uppercase font-bold text-muted-foreground-auto tracking-widest">Contacto Spa</p>}
            
            {spaConfig.phone && (
              <div className={cn("flex flex-col gap-2", isCollapsed && "items-center")}>
                <div className={cn("flex items-center group/wa", isCollapsed ? "justify-center" : "justify-between")}>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 text-foreground/60 text-xs font-medium">
                      <Phone size={14} className="text-primary/70 shrink-0" />
                      <span className="truncate">{spaConfig.phone}</span>
                    </div>
                  )}
                  <a 
                    href={`https://wa.me/${spaConfig.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Contactar por WhatsApp"
                    className={cn(
                      "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-primary-foreground rounded-lg transition-all duration-300",
                      isCollapsed ? "p-2" : "p-1.5"
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className={isCollapsed ? "w-5 h-5" : "w-3.5 h-3.5"}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.938 3.659 1.434 5.63 1.434h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
            {!isCollapsed && (spaConfig.facebook_url || spaConfig.instagram_url) && (
              <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-foreground/5">
                {spaConfig.facebook_url && (
                  <a href={spaConfig.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/50 hover:text-blue-400 transition-colors text-xs group/link">
                    <Facebook size={14} className="shrink-0 group-hover/link:text-blue-500" />
                    <span className="truncate">{spaConfig.facebook_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </a>
                )}
                {spaConfig.instagram_url && (
                  <a href={spaConfig.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/50 hover:text-pink-400 transition-colors text-xs group/link">
                    <Instagram size={14} className="shrink-0 group-hover/link:text-pink-500" />
                    <span className="truncate">{spaConfig.instagram_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
    </>
  );
}
