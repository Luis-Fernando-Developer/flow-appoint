import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Briefcase, 
  Settings,
  User,
  LogOut
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookingLogo } from "@/components/BookingLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Agendamentos", url: "/admin/agendamentos", icon: Calendar },
  { title: "Serviços", url: "/admin/servicos", icon: Briefcase },
  { title: "Colaboradores", url: "/admin/colaboradores", icon: Users },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

interface BusinessSidebarProps {
  companySlug: string;
  companyName: string;
  userRole: string;
}

export function BusinessSidebar({ companySlug, companyName, userRole }: BusinessSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentPath = location.pathname;
  const basePath = `/${companySlug}`;
  
  const isActive = (path: string) => currentPath === `${basePath}${path}`;
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/20 text-primary border-r-2 border-primary" 
      : "hover:bg-primary/10 hover:text-primary";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Filtrar itens do menu baseado no role do usuário
  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'employee' && (item.title === 'Colaboradores' || item.title === 'Configurações')) {
      return false;
    }
    if (userRole === 'receptionist' && item.title === 'Colaboradores') {
      return false;
    }
    return true;
  });

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"}>
      <SidebarContent className="bg-card/30 backdrop-blur-sm border-r border-primary/20">
        {/* Header */}
        <div className="p-4 border-b border-primary/20">
          {state !== "collapsed" ? (
            <div>
              <BookingLogo showText={false} className="mb-2" />
              <h2 className="font-semibold text-gradient truncate">{companyName}</h2>
              <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <BookingLogo showText={false} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={`${basePath}${item.url}`} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavCls(isActive)}`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Actions */}
        <div className="mt-auto p-4 border-t border-primary/20">
          <div className="space-y-2">
            <SidebarMenuButton asChild>
              <NavLink 
                to={`${basePath}/admin/perfil`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary/10"
              >
                <User className="w-5 h-5" />
                {state !== "collapsed" && <span>Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
              {state !== "collapsed" && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}