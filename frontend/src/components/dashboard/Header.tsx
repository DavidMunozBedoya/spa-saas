"use client";

import { Bell, Search, User, Menu, LogOut, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [userName, setUserName] = useState("Usuario");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Cargar nombre de usuario
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.email || "Usuario");
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }

    // Cargar y aplicar tema inicial
    const savedTheme = sessionStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    sessionStorage.setItem("theme", newTheme);
    
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="h-20 glass-header px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 w-1/2 md:w-1/3">
        <button 
          onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
          className="lg:hidden p-2 text-foreground/60 hover:text-primary transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-foreground/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-foreground/60 hover:text-primary transition-all duration-300 hover:scale-110 active:rotate-12"
          title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
          {theme === "dark" ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} className="text-blue-500" />}
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-foreground/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground">{userName}</p>
          </div>
          <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center border border-foreground/20 overflow-hidden">
            <User className="text-foreground/60" size={20} />
          </div>
          <button 
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 ml-2"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
