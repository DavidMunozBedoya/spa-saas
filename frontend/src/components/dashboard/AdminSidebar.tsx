"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Building2, label: "Gestión de Spas", href: "/admin/spas" },
  { icon: Users, label: "Usuarios Plataforma", href: "/admin/users" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className={cn(
      "h-screen flex flex-col glass border-r border-foreground/10 relative transition-all duration-300 z-10",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className="p-8">
        <div className={cn("flex items-center justify-between gap-3 mb-10 px-2", isCollapsed && "px-0 flex-col items-center")}>
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight italic">SaaS Admin</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Platform</p>
            </div>
          </div>

          {/* Toggle Button for Desktop */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-1.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all",
              isCollapsed && "bg-foreground/5 text-foreground"
            )}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group",
                  isCollapsed && "px-0 w-12 h-12 justify-center",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300 group-hover:scale-110 shrink-0",
                    isActive ? "text-primary-foreground" : "text-foreground/40"
                  )} />
                  <span className={cn("font-medium text-sm transition-all duration-300", isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100 uppercase text-[10px] tracking-widest")}>
                    {item.label}
                  </span>
                </div>
                {!isCollapsed && isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={cn("mt-auto p-8 pt-0", isCollapsed && "p-4 flex flex-col items-center")}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar Sesión" : ""}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group",
            isCollapsed && "px-0 w-12 h-12 justify-center"
          )}
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
