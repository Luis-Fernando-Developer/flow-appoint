import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookingLogo } from "@/components/BookingLogo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Plus,
  Search,
  X,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  price: number;
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  service: {
    name: string;
    description?: string;
  };
  company: {
    name: string;
    slug: string;
  };
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function ClientDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clientEmail, setClientEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    fetchCompany();
  }, [slug]);

  const fetchCompany = async () => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      if (!companyData) {
        navigate('/404');
        return;
      }

      setCompany(companyData);
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
      navigate('/404');
    }
  };

  const handleEmailLogin = async () => {
    if (!searchEmail || !company) return;

    setIsLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          company:companies(name, slug)
        `)
        .eq('company_id', company.id)
        .eq('client_id', (
          await supabase
            .from('clients')
            .select('id')
            .eq('company_id', company.id)
            .eq('email', searchEmail)
            .single()
        ).data?.id)
        .order('booking_date', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;

      setBookings(bookingsData || []);
      setClientEmail(searchEmail);
      setIsAuthenticated(true);
      
      if (!bookingsData || bookingsData.length === 0) {
        toast({
          title: "Nenhum agendamento encontrado",
          description: "Não foram encontrados agendamentos para este e-mail.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os agendamentos. Verifique o e-mail.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, booking_status: 'cancelled' }
            : booking
        )
      );

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, label: "Pendente", color: "bg-yellow-500" },
      confirmed: { variant: "default" as const, label: "Confirmado", color: "bg-blue-500" },
      completed: { variant: "default" as const, label: "Concluído", color: "bg-green-500" },
      cancelled: { variant: "destructive" as const, label: "Cancelado", color: "bg-red-500" },
      no_show: { variant: "destructive" as const, label: "Não Compareceu", color: "bg-gray-500" }
    };
    
    const statusConfig = config[status as keyof typeof config];
    return (
      <Badge variant={statusConfig.variant} className="gap-1">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookingLogo />
              <div>
                <h1 className="text-xl font-bold">{company.name}</h1>
                <p className="text-sm text-muted-foreground">Meus Agendamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button 
                  variant="neon" 
                  size="sm"
                  onClick={() => navigate(`/${slug}/agendar`)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Agendamento
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate(`/${slug}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-gradient flex items-center justify-center gap-2">
                <User className="w-6 h-6" />
                Acessar Meus Agendamentos
              </CardTitle>
              <CardDescription>
                Digite seu e-mail para visualizar seus agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-md mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
                  />
                </div>
                <Button
                  onClick={handleEmailLogin}
                  disabled={!searchEmail || isLoading}
                  className="w-full"
                  variant="neon"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? "Buscando..." : "Buscar Agendamentos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Client Info */}
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gradient">Bem-vindo!</CardTitle>
                      <CardDescription>{clientEmail}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsAuthenticated(false);
                      setClientEmail("");
                      setSearchEmail("");
                      setBookings([]);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Sair
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Bookings List */}
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient">Meus Agendamentos</CardTitle>
                    <CardDescription>
                      {bookings.length} agendamento{bookings.length !== 1 ? 's' : ''} encontrado{bookings.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="neon" 
                    onClick={() => navigate(`/${slug}/agendar`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                    <Button 
                      variant="neon" 
                      className="mt-4"
                      onClick={() => navigate(`/${slug}/agendar`)}
                    >
                      Fazer Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-4 border border-primary/20 rounded-lg bg-background/30"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                              {getStatusBadge(booking.booking_status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(booking.booking_date, booking.booking_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.duration_minutes} minutos
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                R$ {booking.price.toFixed(2)}
                              </div>
                            </div>

                            {booking.notes && (
                              <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                                <strong>Observações:</strong> {booking.notes}
                              </p>
                            )}
                          </div>

                          {booking.booking_status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="ml-4"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}