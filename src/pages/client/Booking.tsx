import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookingLogo } from "@/components/BookingLogo";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  Phone,
  ArrowLeft,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface BookingForm {
  client_name: string;
  client_email: string;
  client_phone: string;
  notes: string;
}

export default function ClientBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [formData, setFormData] = useState<BookingForm>({
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Service, 2: DateTime, 3: ClientInfo, 4: Confirmation

  useEffect(() => {
    fetchCompanyAndServices();
  }, [slug]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      generateAvailableTimes();
    }
  }, [selectedDate, selectedService]);

  const fetchCompanyAndServices = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url')
        .eq('slug', slug)
        .single();

      if (companyError) throw companyError;
      if (!companyData) {
        navigate('/404');
        return;
      }

      setCompany(companyData);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive"
      });
    }
  };

  const generateAvailableTimes = () => {
    // Gerar horários disponíveis (9h às 17h, de 30 em 30 minutos)
    const times: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setAvailableTimes(times);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !company) return;

    setIsLoading(true);
    try {
      // Primeiro, criar ou buscar cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .upsert([
          {
            company_id: company.id,
            name: formData.client_name,
            email: formData.client_email,
            phone: formData.client_phone
          }
        ], { 
          onConflict: 'company_id,email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Criar agendamento
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            company_id: company.id,
            client_id: clientData.id,
            service_id: selectedService.id,
            booking_date: format(selectedDate, 'yyyy-MM-dd'),
            booking_time: selectedTime,
            duration_minutes: selectedService.duration_minutes,
            price: selectedService.price,
            notes: formData.notes,
            booking_status: 'pending'
          }
        ]);

      if (bookingError) throw bookingError;

      setStep(4);
      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi registrado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient">Escolha o Serviço</CardTitle>
              <CardDescription>Selecione o serviço desejado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? "border-primary bg-primary/10"
                        : "border-primary/20 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {service.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {selectedService?.id === service.id && (
                        <Check className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedService && (
                <Button onClick={() => setStep(2)} className="w-full mt-4" variant="neon">
                  Continuar
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient">Data e Horário</CardTitle>
              <CardDescription>Selecione quando deseja ser atendido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Escolha a data</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border border-primary/20 bg-background/50"
                />
              </div>
              
              {selectedDate && (
                <div>
                  <Label className="text-base font-medium">Escolha o horário</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1" variant="neon">
                    Continuar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient">Seus Dados</CardTitle>
              <CardDescription>Informe seus dados para o agendamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome completo *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">E-mail *</Label>
                  <Input
                    id="client_email"
                    name="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone *</Label>
                  <Input
                    id="client_phone"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Alguma observação especial?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  disabled={!formData.client_name || !formData.client_email || !formData.client_phone || isLoading}
                  className="flex-1"
                  variant="neon"
                >
                  {isLoading ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-gradient">Agendamento Confirmado!</CardTitle>
              <CardDescription>Seu agendamento foi registrado com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{selectedService?.duration_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">R$ {selectedService?.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Você receberá um e-mail de confirmação em breve.
                </p>
                <Badge variant="secondary">Status: Aguardando Confirmação</Badge>
              </div>

              <Button
                onClick={() => navigate(`/${slug}`)}
                className="w-full"
                variant="neon"
              >
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookingLogo />
              <div>
                <h1 className="text-xl font-bold">{company.name}</h1>
                <p className="text-sm text-muted-foreground">Agendamento Online</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate(`/${slug}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </div>
    </div>
  );
}