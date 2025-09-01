import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingLogo } from "@/components/BookingLogo";
import { Calendar, Clock, Star, MapPin, Phone, Mail, User, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", phone: "" });

  useEffect(() => {
    if (slug) {
      fetchCompanyData();
    }
  }, [slug]);

  const fetchCompanyData = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (companyError) {
        toast({
          title: "Empresa não encontrada",
          description: "A empresa não existe ou está inativa.",
          variant: "destructive",
        });
        return;
      }

      setCompany(companyData);

      // Buscar serviços da empresa
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar login de cliente
    toast({
      title: "Login realizado",
      description: "Redirecionando para agendamentos...",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar cadastro de cliente
    toast({
      title: "Cadastro realizado",
      description: "Bem-vindo! Agora você pode fazer agendamentos.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-4">Empresa não encontrada</h1>
          <p className="text-muted-foreground mb-8">A empresa que você procura não existe ou está inativa.</p>
          <Link to="/">
            <Button variant="neon">Voltar ao Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url && (
                <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-lg" />
              )}
              <h1 className="text-2xl font-bold text-gradient">{company.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/${company.slug}/meus-agendamentos`)}
              >
                Meus Agendamentos
              </Button>
              <Button 
                variant="neon" 
                onClick={() => navigate(`/${company.slug}/agendar`)}
              >
                Agendar Agora
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="text-neon">Agende Agora</span><br />
            <span className="text-foreground">no {company.name}</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Escolha o melhor horário para você. Sistema de agendamento rápido e fácil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="neon"
              onClick={() => navigate(`/${company.slug}/agendar`)}
              className="group"
            >
              Agendar Horário
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="glass"
              onClick={() => navigate(`/${company.slug}/meus-agendamentos`)}
            >
              Meus Agendamentos
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        {services.length > 0 && (
          <section className="mb-16">
            <h3 className="text-3xl font-bold text-gradient text-center mb-12">Nossos Serviços</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.id} className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
                  {service.image_url && (
                    <div className="aspect-video rounded-t-lg overflow-hidden">
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {service.name}
                      <span className="text-lg text-primary">R$ {service.price}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        4.9
                      </div>
                    </div>
                    <Button 
                      variant="neon" 
                      className="w-full" 
                      onClick={() => navigate(`/${company.slug}/agendar`)}
                    >
                      Agendar Este Serviço
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Contact Info */}
        <section className="text-center">
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-gradient">Entre em Contato</CardTitle>
              <CardDescription>Estamos aqui para atendê-lo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.owner_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>{company.owner_email}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{company.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md card-glow bg-card/90 backdrop-blur border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl text-gradient text-center">Entrar</CardTitle>
              <CardDescription className="text-center">
                Acesse sua conta para agendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowLogin(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="neon" className="flex-1">
                    Entrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md card-glow bg-card/90 backdrop-blur border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl text-gradient text-center">Criar Conta</CardTitle>
              <CardDescription className="text-center">
                Cadastre-se para agendar seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="signup-name"
                      placeholder="Seu nome"
                      value={signupData.name}
                      onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="signup-phone"
                      placeholder="(11) 99999-9999"
                      value={signupData.phone}
                      onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 bg-background/50 border-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowSignup(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="neon" className="flex-1">
                    Cadastrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}