import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingLogo } from "@/components/BookingLogo";
import { ArrowLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CompanyForm {
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  owner_cpf: string;
  cnpj: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyForm>({
    name: "",
    slug: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    owner_cpf: "",
    cnpj: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from company name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .trim();
      
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Verificar se o slug já existe
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingCompany) {
        toast({
          title: "URL já existe",
          description: "Esta URL personalizada já está em uso. Escolha outra.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 2. Primeiro criar a empresa diretamente
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.name,
          slug: formData.slug,
          owner_name: formData.owner_name,
          owner_email: formData.owner_email,
          owner_cpf: formData.owner_cpf.replace(/\D/g, ""),
          cnpj: formData.cnpj.replace(/\D/g, ""),
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          status: 'active',
          plan: 'starter'
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 3. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.owner_email,
        password: formData.owner_password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            owner_name: formData.owner_name,
            company_id: companyData.id
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 4. Criar funcionário (proprietário) vinculado à empresa
      const { error: employeeError } = await supabase
        .from('employees')
        .insert([{
          company_id: companyData.id,
          user_id: authData.user.id,
          name: formData.owner_name,
          email: formData.owner_email,
          role: 'owner',
          is_active: true
        }]);

      if (employeeError) throw employeeError;

      toast({
        title: "Empresa criada com sucesso!",
        description: "A empresa foi cadastrada e o proprietário pode fazer login.",
      });

      navigate("/superAdminDev");
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast({
        title: "Erro ao criar empresa",
        description: "Ocorreu um erro ao cadastrar a empresa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BookingLogo />
            <Button variant="outline" onClick={() => navigate("/superAdminDev")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gradient">Adicionar Nova Empresa</CardTitle>
                <CardDescription>
                  Cadastre uma nova empresa no sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Barbearia do João"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Personalizada *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="barbearia-do-joao"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name">Nome do Proprietário *</Label>
                  <Input
                    id="owner_name"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_email">Email do Proprietário *</Label>
                  <Input
                    id="owner_email"
                    name="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={handleInputChange}
                    placeholder="joao@exemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_password">Senha do Proprietário *</Label>
                  <Input
                    id="owner_password"
                    name="owner_password"
                    type="password"
                    value={formData.owner_password}
                    onChange={handleInputChange}
                    placeholder="Digite uma senha segura"
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_cpf">CPF do Proprietário *</Label>
                  <Input
                    id="owner_cpf"
                    name="owner_cpf"
                    value={formatCpf(formData.owner_cpf)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 11) {
                        setFormData(prev => ({ ...prev, owner_cpf: value }));
                      }
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formatCnpj(formData.cnpj)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 14) {
                        setFormData(prev => ({ ...prev, cnpj: value }));
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua das Flores, 123 - Centro"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/superAdminDev")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="neon"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Criando..." : "Criar Empresa"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}