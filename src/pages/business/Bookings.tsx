import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail,
  Filter,
  Plus,
  Edit,
  MoreHorizontal,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500", variant: "secondary" as const },
  confirmed: { label: "Confirmado", color: "bg-green-500", variant: "default" as const },
  cancelled: { label: "Cancelado", color: "bg-red-500", variant: "destructive" as const },
  completed: { label: "Concluído", color: "bg-blue-500", variant: "default" as const },
  no_show: { label: "Não compareceu", color: "bg-gray-500", variant: "secondary" as const }
};

const paymentConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500" },
  confirmed: { label: "Pago", color: "bg-green-500" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
  free: { label: "Isento", color: "bg-blue-500" }
};

export default function BusinessBookings() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    payment: "",
    date: "",
    search: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [slug]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchData = async () => {
    try {
      // Buscar dados da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();

      setCompany(companyData);

      // Buscar dados do funcionário
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('user_id', user.id)
          .single();

        setEmployee(employeeData);

        // Buscar agendamentos
        await fetchBookings(companyData.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (companyId: string) => {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        service:services(*),
        employee:employees(*)
      `)
      .eq('company_id', companyId)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true });

    setBookings(bookingsData || []);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.status) {
      filtered = filtered.filter(booking => booking.booking_status === filters.status);
    }

    if (filters.payment) {
      filtered = filtered.filter(booking => booking.payment_status === filters.payment);
    }

    if (filters.date) {
      filtered = filtered.filter(booking => booking.booking_date === filters.date);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.client?.name.toLowerCase().includes(searchLower) ||
        booking.service?.name.toLowerCase().includes(searchLower) ||
        booking.employee?.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado com sucesso.",
      });

      // Atualizar lista
      await fetchBookings(company.id);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  if (!company || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gradient mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <BusinessLayout 
      companySlug={company.slug} 
      companyName={company.name}
      userRole={employee.role}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os agendamentos do estabelecimento
            </p>
          </div>
          <Button variant="neon">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Buscar cliente, serviço..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="bg-background/50"
              />
              
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Status do agendamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="no_show">Não compareceu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.payment} onValueChange={(value) => setFilters(prev => ({ ...prev, payment: value }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Status do pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os pagamentos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="free">Isento</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="bg-background/50"
              />

              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: "", payment: "", date: "", search: "" })}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground">
                  Não há agendamentos que correspondam aos filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Status Badges */}
                      <div className="flex flex-col gap-2">
                        <Badge variant={statusConfig[booking.booking_status as keyof typeof statusConfig].variant}>
                          <div className={`w-2 h-2 rounded-full ${statusConfig[booking.booking_status as keyof typeof statusConfig].color} mr-1`}></div>
                          {statusConfig[booking.booking_status as keyof typeof statusConfig].label}
                        </Badge>
                        <Badge variant="outline">
                          <div className={`w-2 h-2 rounded-full ${paymentConfig[booking.payment_status as keyof typeof paymentConfig].color} mr-1`}></div>
                          {paymentConfig[booking.payment_status as keyof typeof paymentConfig].label}
                        </Badge>
                      </div>

                      {/* Service & Price */}
                      <div>
                        <h3 className="font-semibold text-lg">{booking.service?.name}</h3>
                        <p className="text-2xl font-bold text-primary">R$ {booking.price}</p>
                      </div>

                      {/* Professional */}
                      <div>
                        <p className="text-sm text-muted-foreground">Profissional</p>
                        <p className="font-medium">{booking.employee?.name || "Não definido"}</p>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <p className="text-sm text-muted-foreground">Data e Horário</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{formatTime(booking.booking_time)}</span>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{booking.client?.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.client?.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {booking.client?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-primary/20">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'completed')}>
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como Concluído
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'no_show')}>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Não Realizado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'cancelled')}>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 p-3 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {booking.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </BusinessLayout>
  );
}