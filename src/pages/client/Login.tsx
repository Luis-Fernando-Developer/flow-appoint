import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingLogo } from "@/components/BookingLogo";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ...imports...

export default function ClientLogin() {
  const { slug } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Autentica o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if there's pending signup data to create client profile
        const pendingSignup = localStorage.getItem('pending_client_signup');
        if (pendingSignup) {
          try {
            const signupData = JSON.parse(pendingSignup);
            if (signupData.slug === slug) {
              // Create client profile from pending data using SECURITY DEFINER function
              const { error: clientError } = await supabase.rpc('create_client_profile', {
                _company_slug: slug,
                _name: signupData.name,
                _email: signupData.email,
                _phone: signupData.phone
              });

              if (clientError) {
                console.error('Error creating client profile:', clientError);
              } else {
                localStorage.removeItem('pending_client_signup');
              }
            }
          } catch (error) {
            console.error('Error parsing pending signup:', error);
            localStorage.removeItem('pending_client_signup');
          }
        }

        // First, get company data to verify the slug
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        if (companyError || !companyData) {
          toast({
            title: "Erro",
            description: "Empresa não encontrada ou inativa.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Busca o cliente vinculado ao usuário autenticado e à empresa
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select(`*`)
          .eq('user_id', data.user.id)
          .eq('company_id', companyData.id)
          .maybeSingle();

        if (clientError) {
          console.error('Error fetching client:', clientError);
          toast({
            title: "Erro no login",
            description: "Erro ao verificar dados do cliente. Tente novamente.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!client) {
          toast({
            title: "Acesso negado",
            description: "Usuário não está cadastrado como cliente desta empresa.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${client.name}`,
        });

        // Redireciona para a página de agendamentos do cliente  
        navigate(`/${slug}/agendamentos`);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
      </div>

      <Card className="w-full max-w-md card-glow bg-card/50 backdrop-blur-sm border-primary/30 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <BookingLogo />
          </div>
          <CardTitle className="text-2xl text-gradient">Acesse sua conta</CardTitle>
          <CardDescription>
            Veja e gerencie suas agendamentos aqui!
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="neon" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to={`/${slug}/cadastro`} className="text-primary hover:text-primary-glow transition-colors">
                Cadastre-se
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Link to={`/${slug}`} className="text-primary hover:text-primary-glow transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Voltar à página inicial
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}