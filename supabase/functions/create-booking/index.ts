import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  company_id: string;
  service_id?: string;
  combo_id?: string;
  combo_items?: string[];
  employee_id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  price: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const bookingData: BookingRequest = await req.json();

    // Validate that either service_id or combo_id is provided
    if (!bookingData.service_id && !bookingData.combo_id) {
      throw new Error("Either service_id or combo_id must be provided");
    }

    // Verify the user is a client of this company
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', bookingData.company_id)
      .single();

    if (clientError || !clientData) {
      throw new Error("User is not a client of this company");
    }

    // If it's a combo, validate that the employee can perform ALL services in the combo
    if (bookingData.combo_id && bookingData.combo_items?.length) {
      console.log("Validating combo services for employee:", bookingData.employee_id);
      console.log("Combo items:", bookingData.combo_items);

      // Fetch services that the employee performs
      const { data: employeeServices, error: esError } = await supabase
        .from('employee_services')
        .select('service_id')
        .eq('employee_id', bookingData.employee_id);

      if (esError) {
        console.error("Error fetching employee services:", esError);
        throw new Error("Failed to validate employee services");
      }

      const employeeServiceIds = new Set((employeeServices || []).map(es => es.service_id));
      console.log("Employee services:", Array.from(employeeServiceIds));

      // Check if the employee has ALL services of the combo
      const missingServices = bookingData.combo_items.filter(
        serviceId => !employeeServiceIds.has(serviceId)
      );

      if (missingServices.length > 0) {
        console.error("Missing services for combo:", missingServices);
        throw new Error("O profissional selecionado não pode realizar todos os serviços deste combo");
      }

      console.log("Employee can perform all combo services ✓");
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          company_id: bookingData.company_id,
          client_id: clientData.id,
          service_id: bookingData.service_id || null,
          combo_id: bookingData.combo_id || null,
          employee_id: bookingData.employee_id,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          duration_minutes: bookingData.duration_minutes,
          price: bookingData.price,
          notes: bookingData.notes || null,
          booking_status: 'pending',
          payment_status: 'pending'
        }
      ])
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      throw bookingError;
    }

    return new Response(JSON.stringify({ booking }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in create-booking function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create booking" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);