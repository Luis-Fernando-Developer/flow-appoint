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

interface Employee {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [formData, setFormData] = useState<BookingForm>({
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Service, 2: Employee, 3: Date, 4: Time, 5: Auth, 6: Confirmation
  const [user, setUser] = useState<any>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    fetchCompanyAndServices();
    checkAuthState();
  }, [slug]);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      // Check if user is client in this company
      if (company) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('company_id', company.id)
          .single();
        
        if (clientData) {
          setClient(clientData);
        }
      }
    }
  };

  useEffect(() => {
    if (company) {
      checkAuthState();
    }
  }, [company]);

  useEffect(() => {
    if (selectedService) {
      fetchEmployeesForService();
    }
  }, [selectedService, company]);

  useEffect(() => {
    if (selectedEmployee) {
      generateAvailableDates();
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (selectedDate && selectedEmployee && selectedService) {
      generateAvailableTimes();
    }
  }, [selectedDate, selectedEmployee, selectedService]);

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

  const fetchEmployeesForService = async () => {
    if (!selectedService || !company) return;

    try {
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('id, name, email, avatar_url')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (error) throw error;
      setEmployees(employeesData || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive"
      });
    }
  };

  const generateAvailableDates = () => {
    // Gerar próximos 30 dias (excluindo domingos para exemplo)
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Excluir domingos (dia 0)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    
    setAvailableDates(dates);
  };

  const generateAvailableTimes = async () => {
    if (!selectedDate || !selectedEmployee || !selectedService || !company) return;

    try {
      // Buscar agendamentos existentes para a data e funcionário
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('booking_time, duration_minutes')
        .eq('employee_id', selectedEmployee.id)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('booking_status', 'confirmed');

      if (error) throw error;

      // Gerar horários disponíveis (9h às 17h, de 30 em 30 minutos)
      const allTimes: string[] = [];
      for (let hour = 9; hour < 17; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      // Filtrar horários já ocupados
      const availableTimes = allTimes.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        return !existingBookings?.some(booking => {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
          const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes;
          const bookingEndTime = bookingTimeInMinutes + booking.duration_minutes;
          const serviceEndTime = timeInMinutes + selectedService.duration_minutes;
          
          // Verificar se há conflito de horários
          return (
            (timeInMinutes >= bookingTimeInMinutes && timeInMinutes < bookingEndTime) ||
            (serviceEndTime > bookingTimeInMinutes && serviceEndTime <= bookingEndTime) ||
            (timeInMinutes <= bookingTimeInMinutes && serviceEndTime >= bookingEndTime)
          );
        });
      });

      setAvailableTimes(availableTimes);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime || !company) return;

    setIsLoading(true);
    try {
      let clientId;
      
      if (user && client) {
        // Use authenticated client
        clientId = client.id;
      } else {
        // This should not happen with the new flow, but keeping as fallback
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
        clientId = clientData.id;
      }

      // Criar agendamento
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            company_id: company.id,
            client_id: clientId,
            service_id: selectedService.id,
            employee_id: selectedEmployee.id,
            booking_date: format(selectedDate, 'yyyy-MM-dd'),
            booking_time: selectedTime,
            duration_minutes: selectedService.duration_minutes,
            price: selectedService.price,
            notes: formData.notes,
            booking_status: 'pending'
          }
        ]);

      if (bookingError) throw bookingError;

      setStep(6);
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
              <CardTitle className="text-gradient">Escolha o Profissional</CardTitle>
              <CardDescription>Selecione quem irá realizar o atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {employees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum profissional disponível para este serviço.
                  </p>
                ) : (
                  employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedEmployee?.id === employee.id
                          ? "border-primary bg-primary/10"
                          : "border-primary/20 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            <p className="text-muted-foreground text-sm">{employee.email}</p>
                          </div>
                        </div>
                        {selectedEmployee?.id === employee.id && (
                          <Check className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                {selectedEmployee && (
                  <Button onClick={() => setStep(3)} className="flex-1" variant="neon">
                    Continuar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient">Escolha a Data</CardTitle>
              <CardDescription>Selecione uma data disponível</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Datas disponíveis</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || !availableDates.some(availableDate => 
                      availableDate.toDateString() === date.toDateString()
                    );
                  }}
                  className="rounded-md border border-primary/20 bg-background/50"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Voltar
                </Button>
                {selectedDate && (
                  <Button onClick={() => setStep(4)} className="flex-1" variant="neon">
                    Continuar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient">Escolha o Horário</CardTitle>
              <CardDescription>Selecione um horário disponível</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableTimes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum horário disponível para esta data.
                </p>
              ) : (
                <div>
                  <Label className="text-base font-medium">Horários disponíveis</Label>
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Voltar
                </Button>
                {selectedTime && (
                  <Button onClick={() => setStep(5)} className="flex-1" variant="neon">
                    Continuar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        if (user && client) {
          // User is authenticated, proceed to booking
          return (
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-gradient">Confirmação dos Dados</CardTitle>
                <CardDescription>Confirme seus dados para o agendamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-background/30 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{client.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{client.phone}</span>
                    </div>
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
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                    Voltar
                  </Button>
                  <Button
                    onClick={handleBookingSubmit}
                    disabled={isLoading}
                    className="flex-1"
                    variant="neon"
                  >
                    {isLoading ? "Agendando..." : "Confirmar Agendamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        } else {
          // User not authenticated, show auth options
          return (
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-gradient">Acesso Necessário</CardTitle>
                <CardDescription>
                  Para continuar com o agendamento, faça login ou crie sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Com sua conta você poderá:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left">
                    <li>• Acompanhar seus agendamentos</li>
                    <li>• Gerenciar seus dados</li>
                    <li>• Receber lembretes por email</li>
                    <li>• Histórico de serviços</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    variant="neon"
                    onClick={() => navigate(`/${slug}/entrar`)}
                  >
                    Já tenho conta - Entrar
                  </Button>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/${slug}/cadastro`)}
                  >
                    Criar nova conta
                  </Button>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="ghost" onClick={() => setStep(4)} className="flex-1">
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }

      case 6:
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
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium">{selectedEmployee?.name}</span>
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