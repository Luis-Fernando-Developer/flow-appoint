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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  Plus, 
  Trash2, 
  Star,
  Wallet
} from "lucide-react";

interface PaymentMethod {
  id: string;
  payment_type: string;
  is_default: boolean;
  card_last_four: string | null;
  card_brand: string | null;
  pix_key: string | null;
}

interface PaymentMethodsManagerProps {
  clientId: string;
  onSelect?: (method: PaymentMethod | null) => void;
  selectedMethod?: string;
}

const paymentTypeIcons: Record<string, any> = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  pix: QrCode,
  cash: Banknote
};

const paymentTypeLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "PIX",
  cash: "Pagar na Hora"
};

export function PaymentMethodsManager({ clientId, onSelect, selectedMethod }: PaymentMethodsManagerProps) {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    payment_type: "pix",
    card_last_four: "",
    card_brand: "",
    pix_key: ""
  });

  useEffect(() => {
    fetchMethods();
  }, [clientId]);

  const fetchMethods = async () => {
    try {
      // Note: client_payment_methods table doesn't exist yet
      // For now, just set empty methods and finish loading
      setMethods([]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Note: client_payment_methods table doesn't exist yet
      // For now, just add to local state
      const newMethod: PaymentMethod = {
        id: crypto.randomUUID(),
        payment_type: formData.payment_type,
        is_default: methods.length === 0,
        card_last_four: formData.payment_type.includes('card') ? formData.card_last_four : null,
        card_brand: formData.payment_type.includes('card') ? formData.card_brand : null,
        pix_key: formData.payment_type === 'pix' ? formData.pix_key : null
      };

      setMethods(prev => [...prev, newMethod]);
      if (onSelect && newMethod.is_default) {
        onSelect(newMethod);
      }

      toast({ title: "Forma de pagamento adicionada!" });
      setDialogOpen(false);
      setFormData({ payment_type: "pix", card_last_four: "", card_brand: "", pix_key: "" });
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar forma de pagamento.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      // Update local state (table doesn't exist yet)
      setMethods(prev => prev.map(m => ({
        ...m,
        is_default: m.id === methodId
      })));

      const newDefault = methods.find(m => m.id === methodId);
      if (newDefault && onSelect) {
        onSelect(newDefault);
      }

      toast({ title: "Forma de pagamento padrão atualizada!" });
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm("Tem certeza que deseja remover esta forma de pagamento?")) return;

    try {
      // Remove from local state (table doesn't exist yet)
      setMethods(prev => prev.filter(m => m.id !== methodId));
      toast({ title: "Forma de pagamento removida!" });
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.payment_type) {
      case 'credit_card':
      case 'debit_card':
        return `${method.card_brand || 'Cartão'} •••• ${method.card_last_four || '****'}`;
      case 'pix':
        return method.pix_key ? `PIX: ${method.pix_key.substring(0, 10)}...` : 'PIX';
      case 'cash':
        return 'Pagar na Hora';
      default:
        return paymentTypeLabels[method.payment_type] || method.payment_type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Formas de Pagamento
        </h3>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma forma de pagamento cadastrada
            </p>
            <Button variant="link" size="sm" onClick={() => setDialogOpen(true)}>
              Adicionar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {methods.map((method) => {
            const Icon = paymentTypeIcons[method.payment_type] || CreditCard;
            const isSelected = selectedMethod === method.id;
            
            return (
              <div
                key={method.id}
                onClick={() => onSelect?.(method)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-primary/20 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary text-white' : 'bg-primary/10'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getMethodDisplay(method)}</p>
                    <p className="text-xs text-muted-foreground">
                      {paymentTypeLabels[method.payment_type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(method.id);
                      }}
                    >
                      Definir padrão
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(method.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Payment Options (for users without saved methods) */}
      {methods.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Ou escolha uma opção rápida:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(paymentTypeLabels).map(([type, label]) => {
              const Icon = paymentTypeIcons[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    onSelect?.({ 
                      id: type, 
                      payment_type: type, 
                      is_default: false, 
                      card_last_four: null, 
                      card_brand: null, 
                      pix_key: null 
                    });
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Adicionar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Cadastre uma nova forma de pagamento
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Pagamento</Label>
              <RadioGroup
                value={formData.payment_type}
                onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                className="grid grid-cols-2 gap-2"
              >
                {Object.entries(paymentTypeLabels).map(([type, label]) => {
                  const Icon = paymentTypeIcons[type];
                  return (
                    <div key={type}>
                      <RadioGroupItem value={type} id={type} className="peer sr-only" />
                      <Label
                        htmlFor={type}
                        className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {(formData.payment_type === 'credit_card' || formData.payment_type === 'debit_card') && (
              <>
                <div className="space-y-2">
                  <Label>Bandeira do Cartão</Label>
                  <Input
                    placeholder="Visa, Mastercard, etc."
                    value={formData.card_brand}
                    onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Últimos 4 dígitos</Label>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={formData.card_last_four}
                    onChange={(e) => setFormData({ ...formData, card_last_four: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </>
            )}

            {formData.payment_type === 'pix' && (
              <div className="space-y-2">
                <Label>Chave PIX (opcional)</Label>
                <Input
                  placeholder="CPF, email, telefone ou chave aleatória"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="neon">
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}