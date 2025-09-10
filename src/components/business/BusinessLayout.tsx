import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";
import { User as SupabaseUser } from '@supabase/supabase-js';

interface BusinessLayoutProps {
  children: ReactNode;
  companySlug: string;
  companyName: string;
  companyId: string;
  userRole: string;
  currentUser?: SupabaseUser | null;
}

export function BusinessLayout({ children, companySlug, companyName, companyId, userRole, currentUser }: BusinessLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <BusinessSidebar 
          companySlug={companySlug} 
          companyName={companyName}
          companyId={companyId}
          userRole={userRole}
          currentUser={currentUser}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Header with Trigger */}
          <header className="h-14 flex items-center border-b border-primary/20 bg-card/30 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-foreground hover:bg-primary/10" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gradient">{companyName} - Painel Administrativo</h1>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}