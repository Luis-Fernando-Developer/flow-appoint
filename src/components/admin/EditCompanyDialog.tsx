import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Percent } from "lucide-react";

interface Company {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  status: string;
  plan: string;
  slug: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cnpj?: string;
  owner_cpf: string;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  quarterly_price: number;
  annual_price: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  billing_period: string;
  original_price: number;
  discount_percentage: number;
  discounted_price?: number;
  discount_cycles_remaining: number;
}

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCompanyDialog({ company, open, onOpenChange, onSuccess }: EditCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [descontoEspecial, setDescontoEspecial] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    owner_name: "",
    owner_email: "",
    owner_cpf: "",
    cnpj: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    status: "active",
    plan: "starter",
    slug: "",
  });

  const [discountData, setDiscountData] = useState({
    percentage: 0,
    cycles: 1,
    billingPeriod: "monthly"
  });

  // Fetch plans and subscription on open
  useEffect(() => {
    if (open && company) {
      fetchPlans();
      fetchSubscription();
    }
  }, [open, company]);

  // Update form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        owner_name: company.owner_name || "",
        owner_email: company.owner_email || "",
        owner_cpf: company.owner_cpf || "",
        cnpj: company.cnpj || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        status: company.status || "active",
        plan: company.plan || "starter",
        slug: company.slug || "",
      });
    }
  }, [company]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('id, name, monthly_price, quarterly_price, annual_price')
      .eq('is_active', true);
    
    if (data) setPlans(data);
  };

  const fetchSubscription = async () => {
    if (!company) return;
    
    const { data } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    
    if (data) {
      setSubscription(data);
      if (data.discount_percentage > 0) {
        setDescontoEspecial(true);
        setDiscountData({
          percentage: data.discount_percentage,
          cycles: data.discount_cycles_remaining,
          billingPeriod: data.billing_period
        });
      }
    }
  };

  const getCurrentPlanPrice = () => {
    const plan = plans.find(p => p.name.toLowerCase() === formData.plan.toLowerCase());
    if (!plan) return 0;

    switch (discountData.billingPeriod) {
      case 'quarterly':
        return plan.quarterly_price;
      case 'annual':
        return plan.annual_price;
      default:
        return plan.monthly_price;
    }
  };

  const calculateDiscountedPrice = () => {
    const originalPrice = getCurrentPlanPrice();
    const discount = discountData.percentage / 100;
    return originalPrice * (1 - discount);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'quarterly':
        return 'Trimestral';
      case 'annual':
        return 'Anual';
      default:
        return 'Mensal';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    try {
      // Update company
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          owner_name: formData.owner_name,
          owner_email: formData.owner_email,
          owner_cpf: formData.owner_cpf,
          cnpj: formData.cnpj,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          status: formData.status,
          plan: formData.plan,
          slug: formData.slug,
        })
        .eq('id', company.id);

      if (companyError) throw companyError;

      // Handle subscription/discount
      if (descontoEspecial) {
        const plan = plans.find(p => p.name.toLowerCase() === formData.plan.toLowerCase());
        
        if (plan) {
          const originalPrice = getCurrentPlanPrice();
          const discountedPrice = calculateDiscountedPrice();

          if (subscription) {
            // Update existing subscription
            await supabase
              .from('company_subscriptions')
              .update({
                plan_id: plan.id,
                billing_period: discountData.billingPeriod,
                original_price: originalPrice,
                discount_percentage: discountData.percentage,
                discounted_price: discountedPrice,
                discount_cycles_remaining: discountData.cycles,
              })
              .eq('id', subscription.id);
          } else {
            // Create new subscription
            await supabase
              .from('company_subscriptions')
              .insert([{
                company_id: company.id,
                plan_id: plan.id,
                billing_period: discountData.billingPeriod,
                original_price: originalPrice,
                discount_percentage: discountData.percentage,
                discounted_price: discountedPrice,
                discount_cycles_remaining: discountData.cycles,
                status: 'active'
              }]);
          }
        }
      } else if (subscription && subscription.discount_percentage > 0) {
        // Remove discount
        await supabase
          .from('company_subscriptions')
          .update({
            discount_percentage: 0,
            discounted_price: subscription.original_price,
            discount_cycles_remaining: 0
          })
          .eq('id', subscription.id);
      }

      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram atualizados com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Edite as informações da empresa abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_name">Nome do Proprietário</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_email">Email do Proprietário</Label>
              <Input
                id="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_cpf">CPF do Proprietário</Label>
              <Input
                id="owner_cpf"
                value={formData.owner_cpf}
                onChange={(e) => setFormData({ ...formData, owner_cpf: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Discount Special Section */}
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  <Label>Aplicar Desconto Especial</Label>
                </div>
                <Switch
                  checked={descontoEspecial}
                  onCheckedChange={setDescontoEspecial}
                />
              </div>

              {descontoEspecial && (
                <div className="space-y-4 pt-4 border-t border-primary/10">
                  {/* Plan Info */}
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Plano Atual</p>
                    <p className="font-semibold text-lg capitalize">{formData.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      Valor Base ({getPeriodLabel(discountData.billingPeriod)}): {formatPrice(getCurrentPlanPrice())}
                    </p>
                  </div>

                  {/* Billing Period */}
                  <div className="space-y-2">
                    <Label>Período de Cobrança</Label>
                    <Select 
                      value={discountData.billingPeriod} 
                      onValueChange={(value) => setDiscountData({ ...discountData, billingPeriod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Discount Percentage */}
                    <div className="space-y-2">
                      <Label>Percentual de Desconto (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountData.percentage}
                        onChange={(e) => setDiscountData({ ...discountData, percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    {/* Discount Cycles */}
                    <div className="space-y-2">
                      <Label>Número de Ciclos</Label>
                      <Input
                        type="number"
                        min="1"
                        value={discountData.cycles}
                        onChange={(e) => setDiscountData({ ...discountData, cycles: parseInt(e.target.value) || 1 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Próximas {discountData.cycles} {discountData.cycles === 1 ? 'fatura' : 'faturas'} com desconto
                      </p>
                    </div>
                  </div>

                  {/* Calculated Price */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Valor Calculado</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gradient">
                        {formatPrice(calculateDiscountedPrice())}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(getCurrentPlanPrice())}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Economia de {formatPrice(getCurrentPlanPrice() - calculateDiscountedPrice())} por ciclo
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} variant="neon">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}