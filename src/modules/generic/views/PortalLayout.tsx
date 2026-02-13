import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 md:block border-r bg-muted/40">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-hidden bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
