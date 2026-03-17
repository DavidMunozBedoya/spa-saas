import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Área de Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen transition-all duration-300 w-full overflow-hidden">
        <Header />
        <div className="p-4 md:p-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Fondo Decorativo */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>
    </div>
  );
}
