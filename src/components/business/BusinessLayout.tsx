import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";
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
      <div className="min-h-full flex w-full bg-gradient-hero ">
        <BusinessSidebar 
          companySlug={companySlug} 
          companyName={companyName}
          companyId={companyId}
          userRole={userRole}
          currentUser={currentUser}
        />
        
        <main className="flex-1 flex flex-col w-full relative">
          {/* Header with Trigger */}
          <div className="w-full  border border-blue-600 ">
            <header className=" h-fit w-full flex items-center border-b border-primary/20 bg-card/80 backdrop-blur-2xl px-4 fixed top-[env(safe-area-inset-top)]  z-10 ">
              <SidebarTrigger className="text-foreground hover:bg-primary/10 " />
              <div className="ml-4 flex flex-col -space-y-2 py-3">
                <h1 className="text-lg font-semibold text-gradient">{companyName} - Painel Administrativo</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <a className="stroke-primary-glow border-dashed">https://bookingFy.com.br/{companySlug}</a>
                  <Button size="sm" variant="link" className="ml-2 p-0"><Copy /></Button>
                </div>
              </div>
            </header>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 w-full mt-[80px]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}