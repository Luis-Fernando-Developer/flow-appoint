import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingLogo } from "@/components/BookingLogo";
import { Calendar, Clock, User, LogOut, Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  booking_status: string;
  payment_status: string;
  duration_minutes: number;
  price: number;
  notes?: string;
  services: {
    name: string;
  };
  employees?: {
    name: string;
  };
}

export default function ClientBookings() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [slug]);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate(`/${slug}/entrar`);
        return;
      }

      // Get company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (companyError || !companyData) {
        toast({
          title: "Erro",
          description: "Empresa não encontrada.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setCompany(companyData);

      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('company_id', companyData.id)
        .single();

      if (clientError || !clientData) {
        toast({
          title: "Acesso negado",
          description: "Você não tem acesso a esta empresa.",
          variant: "destructive",
        });
        navigate(`/${slug}/entrar`);
        return;
      }

      setClient(clientData);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            name
          ),
          employees (
            name
          )
        `)
        .eq('client_id', clientData.id)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        toast({
          title: "Erro",
          description: "Erro ao carregar agendamentos.",
          variant: "destructive",
        });
      } else {
        setBookings(bookingsData || []);
      }

    } catch (error) {
      console.error('Error in checkAuthAndFetchData:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate(`/${slug}`);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 card-glow bg-card/50 backdrop-blur-sm border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BookingLogo />
                <div>
                  <CardTitle className="text-2xl text-gradient">Meus Agendamentos</CardTitle>
                  <CardDescription>
                    Olá, {client?.name}! Aqui estão seus agendamentos em {company?.name}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/${slug}`)}
                  className="bg-background/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  variant="neon" 
                  onClick={() => navigate(`/${slug}/agendar`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="bg-background/50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Você ainda não tem agendamentos. Que tal marcar seu primeiro serviço?
              </p>
              <Button 
                variant="neon" 
                onClick={() => navigate(`/${slug}/agendar`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Fazer Primeiro Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="card-glow bg-card/50 backdrop-blur-sm border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{booking.services.name}</h3>
                        <Badge className={`text-white ${getStatusColor(booking.booking_status)}`}>
                          {getStatusLabel(booking.booking_status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(booking.booking_time)} ({booking.duration_minutes} min)</span>
                        </div>
                        {booking.employees && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{booking.employees.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Pagamento: </span>
                          <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {getPaymentStatusLabel(booking.payment_status)}
                          </Badge>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-background/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        R$ {Number(booking.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}