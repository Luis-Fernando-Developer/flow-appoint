import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingLogo } from "@/components/BookingLogo";
import { Building2, User, Mail, FileText, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SignUp() {
  const [formData, setFormData] = useState({
    companyName: "",
    customUrl: "",
    ownerName: "",
    ownerCpf: "",
    ownerMail: "",
    ownerPass: "",
    ownerPassRepeat:"",
    companyCnpj: ""
  });
  const [urlAvailable, setUrlAvailable] = useState<boolean | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset URL availability when custom URL changes
    if (field === 'customUrl') {
      setUrlAvailable(null);
    }
  };

  const checkUrlAvailability = async () => {
    if (!formData.customUrl) return;
    
    setIsCheckingUrl(true);
    
    // Simulate API call - in real app would check against database
    setTimeout(() => {
      // For demo purposes, consider URLs with "test" as unavailable
      const available = !formData.customUrl.toLowerCase().includes('test');
      setUrlAvailable(available);
      setIsCheckingUrl(false);
    }, 1000);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!urlAvailable) {
        toast({
          title: "URL indisponível",
          description: "Por favor, escolha uma URL personalizada disponível.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.ownerPass !== formData.ownerPassRepeat) {
        toast({
          title: "Senhas não conferem",
          description: "Por favor, verifique se as senhas são iguais.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerMail,
        password: formData.ownerPass,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 1.1. Fazer login automaticamente após signup (para ter auth.uid() disponível)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.ownerMail,
        password: formData.ownerPass
      });

      if (loginError) throw loginError;

      // 2. Criar empresa no banco
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.companyName,
          slug: formData.customUrl,
          owner_name: formData.ownerName,
          owner_email: formData.ownerMail,
          owner_cpf: formData.ownerCpf.replace(/\D/g, ""),
          cnpj: formData.companyCnpj.replace(/\D/g, ""),
          status: 'active',
          plan: 'starter'
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 3. Criar funcionário (proprietário) vinculado à empresa
      const { error: employeeError } = await supabase
        .from('employees')
        .insert([{
          company_id: companyData.id,
          user_id: authData.user.id,
          name: formData.ownerName,
          email: formData.ownerMail,
          role: 'owner',
          is_active: true
        }]);

      if (employeeError) throw employeeError;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Sua empresa ${formData.companyName} foi cadastrada!`,
      });

      // Redirecionar para o login da empresa
      window.location.href = `/${formData.customUrl}/admin/login`;
      
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      toast({
        title: "Erro ao cadastrar empresa",
        description: "Ocorreu um erro ao cadastrar a empresa. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <BookingLogo className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-gradient mb-2">Cadastre seu Estabelecimento</h1>
          <p className="text-muted-foreground">
            Comece sua transformação digital hoje mesmo
          </p>
        </div>

        <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Dados do Estabelecimento</CardTitle>
            <CardDescription className="text-center">
              Preencha as informações para criar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="companyName"
                    placeholder="Ex: Viking Barbearia"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Custom URL */}
              <div className="space-y-2">
                <Label htmlFor="customUrl">URL Personalizada *</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    bookingfy.com.br/
                  </span>
                  <div className="relative flex-1">
                    <Input
                      id="customUrl"
                      placeholder="viking-barbearia"
                      value={formData.customUrl}
                      onChange={(e) => handleInputChange('customUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                      required
                    />
                    {formData.customUrl && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isCheckingUrl ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : urlAvailable === true ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : urlAvailable === false ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={checkUrlAvailability}
                    disabled={!formData.customUrl || isCheckingUrl}
                    size="sm"
                  >
                    Verificar
                  </Button>
                </div>
                {urlAvailable === false && (
                  <p className="text-sm text-red-500">URL não disponível. Tente outra opção.</p>
                )}
                {urlAvailable === true && (
                  <p className="text-sm text-green-500">URL disponível! 🎉</p>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName">Nome do Empresário *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="ownerName"
                    placeholder="João Silva"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="ownerCpf">CPF do Empresário *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="ownerCpf"
                    placeholder="000.000.000-00"
                    value={formData.ownerCpf}
                    onChange={(e) => handleInputChange('ownerCpf', formatCpf(e.target.value))}
                    className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                    maxLength={14}
                    required
                  />
                </div>
              </div>
              {/* Email  */}
              <div>
                <Label htmlFor="ownerMail">Email da Empresa</Label>
                <div>
                  <Input
                   id="ownerMail"
                   placeholder="barbearia@jhonDoe.com"
                   value={formData.ownerMail}
                   onChange={(e) => handleInputChange("ownerMail", e.target.value)}
                  />
                </div>
              </div>
               {/* Senha */}
               <div className="space-y-2">
                 <Label htmlFor="ownerPass">Senha *</Label>
                 <div className="relative">
                   <Input
                     id="ownerPass"
                     type="password"
                     placeholder="Digite uma senha"
                     value={formData.ownerPass}
                     onChange={(e) => handleInputChange('ownerPass', e.target.value)}
                     className="bg-background/50 border-primary/30 focus:border-primary"
                     minLength={6}
                     required
                   />
                 </div>
               </div>

               {/* Repetir Senha */}
               <div className="space-y-2">
                 <Label htmlFor="ownerPassRepeat">Confirmar Senha *</Label>
                 <div className="relative">
                   <Input
                     id="ownerPassRepeat"
                     type="password"
                     placeholder="Digite a senha novamente"
                     value={formData.ownerPassRepeat}
                     onChange={(e) => handleInputChange('ownerPassRepeat', e.target.value)}
                     className="bg-background/50 border-primary/30 focus:border-primary"
                     minLength={6}
                     required
                   />
                 </div>
               </div>
              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="companyCnpj">CNPJ da Empresa (opcional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="companyCnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.companyCnpj}
                    onChange={(e) => handleInputChange('companyCnpj', formatCnpj(e.target.value))}
                    className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                    maxLength={18}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="neon" 
                className="w-full" 
                disabled={isLoading || !urlAvailable}
                size="lg"
              >
                {isLoading ? "Cadastrando Estabelecimento..." : "Cadastrar Estabelecimento"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-primary/20 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <a href="/Login" className="text-primary hover:text-primary-glow transition-colors">
                  Faça login aqui
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}