import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

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

export default function ClientLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, [slug]);

  useEffect(() => {
    if (company) {
      fetchClientAndBookings();
    }
  }, [company]);

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

  const fetchClientAndBookings = async () => {
    setIsLoading(true);
    try {
      // Pega usuário logado do Supabase Auth
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        navigate(`/${slug}/entrar`);
        setIsLoading(false);
        return;
      }

      // Busca cliente pelo user_id e company_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('company_id', company?.id)
        .single();

      if (clientError || !clientData) {
        toast({
          title: "Acesso negado",
          description: "Usuário não está cadastrado como cliente.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate(`/${slug}/entrar`);
        setIsLoading(false);
        return;
      }

      setClient(clientData);

      // Busca agendamentos do cliente
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          company:companies(name, slug)
        `)
        .eq('client_id', clientData.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      setBookings(bookingsData || []);
    } catch (error) {
      console.error("Erro ao buscar dados do cliente/agendamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <ClientSidebar
          clientId={client?.id || "N/A"}
          currentUser={null}
          companySlug={company?.slug || ""}
          companyName={company?.name || ""}
          companyId={company?.id || ""}
        />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-fit flex items-center border-b border-primary/20 bg-card/30 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-foreground hover:bg-primary/10" />
            <div className="ml-4 flex flex-col py-3">
              <h1 className="text-lg font-semibold text-gradient">
                Olá, {client?.name || ""}
              </h1>
            </div>
          </header>

          {/* Conteúdo principal */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Informações do cliente */}
              <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        {/* Ícone do cliente */}
                      </div>
                      <div>
                        <CardTitle className="text-gradient">Bem-vindo!</CardTitle>
                        <CardDescription>{client?.email}</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        navigate(`/${company?.slug}/entrar`);
                      }}
                    >
                      Sair
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Lista de agendamentos */}
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
                      onClick={() => navigate(`/${company?.slug}/agendar`)}
                    >
                      Novo Agendamento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Carregando...</div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                      <Button 
                        variant="neon" 
                        className="mt-4"
                        onClick={() => navigate(`/${company?.slug}/agendar`)}
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
                                {/* Badge de status */}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  {/* Data e hora */}
                                  {booking.booking_date} {booking.booking_time}
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Duração */}
                                  {booking.duration_minutes} minutos
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Preço */}
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}