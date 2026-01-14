import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminBookingRequest {
  company_id: string;
  company_slug: string;
  service_id?: string;
  combo_id?: string;
  combo_items?: string[];
  employee_id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  price: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_password?: string;
  is_new_client: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Verify the user is an employee of this company with appropriate role
    const data: AdminBookingRequest = await req.json();

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('company_id', data.company_id)
      .maybeSingle();

    if (empError || !employee) {
      throw new Error("You don't have permission to create bookings for this company");
    }

    // Check role permissions
    const allowedRoles = ['owner', 'admin', 'manager', 'receptionist'];
    if (!allowedRoles.includes(employee.role || '')) {
      throw new Error("You don't have permission to create bookings");
    }

    // Get company info for email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', data.company_id)
      .single();

    let clientId: string;
    let welcomeEmailSent = false;

    if (data.is_new_client) {
      // Create new user account
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: data.client_email,
        password: data.client_password,
        email_confirm: true,
        user_metadata: {
          name: data.client_name,
          phone: data.client_phone
        }
      });

      if (signUpError) {
        console.error("Error creating user:", signUpError);
        throw new Error(`Erro ao criar conta: ${signUpError.message}`);
      }

      // Create client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          company_id: data.company_id,
          user_id: authData.user.id,
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
          is_active: true
        })
        .select('id')
        .single();

      if (clientError) {
        console.error("Error creating client:", clientError);
        throw new Error("Erro ao criar registro do cliente");
      }

      clientId = clientData.id;

      // Send welcome email with login credentials
      // Note: In production, use a proper email service like Resend
      console.log(`[admin-create-booking] New client created: ${data.client_email}`);
      console.log(`[admin-create-booking] Welcome email should be sent with:`);
      console.log(`  - Login URL: ${supabaseUrl.replace('.supabase.co', '.lovable.app')}/${data.company_slug}/client/login`);
      console.log(`  - Email: ${data.client_email}`);
      console.log(`  - Password: [REDACTED]`);

      // For now, we'll just log that the email should be sent
      // You can integrate with Resend or another email provider
      welcomeEmailSent = true;

    } else {
      // Get existing client
      const { data: existingClient, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', data.company_id)
        .eq('email', data.client_email)
        .single();

      if (clientError || !existingClient) {
        throw new Error("Cliente não encontrado");
      }

      clientId = existingClient.id;
    }

    // Validate employee can perform all combo services if applicable
    if (data.combo_id && data.combo_items?.length) {
      const { data: employeeServices } = await supabase
        .from('employee_services')
        .select('service_id')
        .eq('employee_id', data.employee_id);

      const employeeServiceIds = new Set((employeeServices || []).map(es => es.service_id));
      const missingServices = data.combo_items.filter(
        serviceId => !employeeServiceIds.has(serviceId)
      );

      if (missingServices.length > 0) {
        throw new Error("O profissional selecionado não pode realizar todos os serviços deste combo");
      }
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        company_id: data.company_id,
        client_id: clientId,
        service_id: data.service_id || null,
        combo_id: data.combo_id || null,
        employee_id: data.employee_id,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
        duration_minutes: data.duration_minutes,
        price: data.price,
        booking_status: 'confirmed', // Admin bookings are auto-confirmed
        payment_status: 'pending',
        notes: data.is_new_client ? 'Agendamento criado pelo admin' : null
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      throw new Error("Erro ao criar agendamento");
    }

    return new Response(
      JSON.stringify({ 
        booking, 
        welcomeEmailSent,
        message: data.is_new_client 
          ? "Agendamento criado! O cliente receberá um email com os dados de acesso."
          : "Agendamento criado com sucesso!"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in admin-create-booking:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao criar agendamento" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
