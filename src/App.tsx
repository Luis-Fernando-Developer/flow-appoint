import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/admin/Login";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import CreateCompany from "./pages/admin/CreateCompany";
import SignUp from "./pages/SignUp";
import BusinessLogin from "./pages/business/Login";
import CompanyLandingPage from "./pages/company/[slug]";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessBookings from "./pages/business/Bookings";
import BusinessServices from "./pages/business/Services";
import BusinessEmployees from "./pages/business/Employees";
import BusinessSettings from "./pages/business/Settings";
import BusinessProfile from "./pages/business/Profile";
import ClientBooking from "./pages/client/Booking";
import ClientLayout from "./components/client/ClientLayout";
// import ClientLayout from "./pages/client/";
import NotFound from "./pages/NotFound";
import ClientLogin from "./pages/client/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* rota landipage para empresarios */}
          <Route path="/" element={<LandingPage />} />
          {/* rota cadastro para empresarios via landipage */}
          <Route path="/signup" element={<SignUp />} />

          {/* rotas login para empresarios via landingpage ou diretamente via slog */}
          <Route path="/login" element={<BusinessLogin />} />
          <Route path="/:slug/admin/login" element={<BusinessLogin />} />

          {/* rota admin do sistema */}
          <Route path="/super-admin/login" element={<AdminLogin />} />
          {/* rota painel admin super admin */}
          <Route path="/super-admin/painel" element={<SuperAdminDashboard />} />
          {/* rota para criar/adicionar empresa via painel super admin */}
          <Route path="/super-admin/add-company" element={<CreateCompany />} />

          {/* rota painel admin empresa */}
          <Route path="/:slug/admin/dashboard" element={<BusinessDashboard />} />
          {/* rota agendamentos painel admin empresa */}
          <Route path="/:slug/admin/agendamentos" element={<BusinessBookings />} />
          {/* rota serviços painel admin empresa */}
          <Route path="/:slug/admin/servicos" element={<BusinessServices />} />
          {/* rota colaboradores painel admin empresa */}
          <Route path="/:slug/admin/colaboradores" element={<BusinessEmployees />} />
          {/* rota config painel admin empresa */}
          <Route path="/:slug/admin/configuracoes" element={<BusinessSettings />} />
          {/* rota perfil painel admin empresa com base */}
          <Route path="/:slug/admin/perfil" element={<BusinessProfile />} />

          {/* rota landingpage empresa por parametro [slug] */}
          <Route path="/:slug" element={<CompanyLandingPage />} />
          
          {/* rota para cliente final agendar procedimentos na empresa via slug */}
          <Route path="/:slug/agendar" element={<ClientBooking />} />
          {/* rota para cliente realizar login na empresa via slug */}
          <Route path="/:slug/entrar" element={<ClientLogin />} />
          {/* rota para cliente realizar cadastro na empresa via slug */}
          <Route path="/:slug/cadastro" element={<ClientLayout />} />
          {/* rota para cliente realizar cadastro na empresa via slug */}
          <Route path="/:slug/[user]/agendamentos" element={<ClientLayout />} />

          {/* rota não existente '404' */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
