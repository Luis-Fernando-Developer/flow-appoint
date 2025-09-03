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
import ClientDashboard from "./pages/client/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<BusinessLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/superAdminDev" element={<SuperAdminDashboard />} />
          <Route path="/admin/create-company" element={<CreateCompany />} />
          <Route path="/:slug" element={<CompanyLandingPage />} />
          <Route path="/:slug/agendar" element={<ClientBooking />} />
          <Route path="/:slug/meus-agendamentos" element={<ClientDashboard />} />
          <Route path="/:slug/admin/login" element={<BusinessLogin />} />
          <Route path="/:slug/admin/dashboard" element={<BusinessDashboard />} />
          <Route path="/:slug/admin/agendamentos" element={<BusinessBookings />} />
          <Route path="/:slug/admin/servicos" element={<BusinessServices />} />
          <Route path="/:slug/admin/colaboradores" element={<BusinessEmployees />} />
          <Route path="/:slug/admin/configuracoes" element={<BusinessSettings />} />
          <Route path="/:slug/admin/perfil" element={<BusinessProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
