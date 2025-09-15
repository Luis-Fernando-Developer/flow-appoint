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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCompanyDialog({ company, open, onOpenChange, onSuccess }: EditCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || "",
    owner_name: company?.owner_name || "",
    owner_email: company?.owner_email || "",
    owner_cpf: company?.owner_cpf || "",
    cnpj: company?.cnpj || "",
    phone: company?.phone || "",
    address: company?.address || "",
    city: company?.city || "",
    state: company?.state || "",
    status: company?.status || "active",
    plan: company?.plan || "starter",
    slug: company?.slug || "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id);

      if (error) throw error;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
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

          <DialogFooter>
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