import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  company_id: string;
  service_id: string;
  employee_id?: string;
  date: string; // YYYY-MM-DD
}

interface TimeSlot {
  time: string;
  employee_id: string;
  employee_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Support both GET and POST methods
    let company_id: string;
    let service_id: string;
    let employee_id: string | undefined;
    let date: string;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      company_id = url.searchParams.get('company_id') || '';
      service_id = url.searchParams.get('service_id') || '';
      employee_id = url.searchParams.get('employee_id') || undefined;
      date = url.searchParams.get('date') || '';
    } else {
      const body = await req.json() as AvailabilityRequest;
      company_id = body.company_id;
      service_id = body.service_id;
      employee_id = body.employee_id;
      date = body.date;
    }

    console.log(`[get-availability] Method: ${req.method}, company_id: ${company_id}, service_id: ${service_id}, employee_id: ${employee_id}, date: ${date}`);

    if (!company_id || !service_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: company_id, service_id, date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestDate.getDay();

    console.log(`[get-availability] Day of week: ${dayOfWeek}`);

    // 1. Get company schedule settings
    const { data: settings } = await supabase
      .from('company_schedule_settings')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    const slotDuration = settings?.slot_duration || 30;
    const minAdvanceHours = settings?.min_booking_advance_hours || 1;

    // 2. Get business hours for this day
    const { data: businessHours } = await supabase
      .from('business_hours')
      .select('*')
      .eq('company_id', company_id)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    console.log(`[get-availability] Business hours for day ${dayOfWeek}:`, businessHours);

    // Check if business is open
    if (!businessHours || !businessHours.is_open) {
      console.log('[get-availability] Business is closed on this day');
      return new Response(
        JSON.stringify({ slots: [], availability: [], message: 'Estabelecimento fechado neste dia' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check for company-wide blocked slots
    const { data: companyBlocks } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('company_id', company_id)
      .eq('blocked_date', date)
      .eq('is_company_wide', true);

    if (companyBlocks && companyBlocks.some(b => !b.start_time)) {
      console.log('[get-availability] Company-wide block for entire day');
      return new Response(
        JSON.stringify({ slots: [], availability: [], message: 'Data bloqueada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get service info
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .single();

    if (!service) {
      return new Response(
        JSON.stringify({ error: 'Serviço não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceDuration = service.duration_minutes;

    // 5. Get employees for this service
    let employeeQuery = supabase
      .from('employees')
      .select(`
        id, 
        name, 
        employee_type,
        employee_services!inner(service_id)
      `)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .eq('employee_services.service_id', service_id);

    if (employee_id) {
      employeeQuery = employeeQuery.eq('id', employee_id);
    }

    const { data: employees } = await employeeQuery;

    console.log(`[get-availability] Found ${employees?.length || 0} employees for this service`);

    if (!employees || employees.length === 0) {
      console.log('[get-availability] No employees for this service');
      return new Response(
        JSON.stringify({ slots: [], availability: [], message: 'Nenhum profissional disponível para este serviço' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allSlots: TimeSlot[] = [];
    const availabilityByEmployee: { employee_id: string; employee_name: string; slots: string[] }[] = [];

    for (const employee of employees) {
      console.log(`[get-availability] Processing employee: ${employee.name} (${employee.employee_type})`);

      const employeeSlots: string[] = [];

      // 6. Check employee absences
      const { data: absences } = await supabase
        .from('employee_absences')
        .select('*')
        .eq('employee_id', employee.id)
        .lte('start_date', date)
        .gte('end_date', date);

      if (absences && absences.length > 0) {
        console.log(`[get-availability] Employee ${employee.name} is absent`);
        continue;
      }

      // 7. Get employee schedule based on type
      let employeeStart: string | null = null;
      let employeeEnd: string | null = null;
      let breakStart: string | null = null;
      let breakEnd: string | null = null;

      if (employee.employee_type === 'fixo') {
        // Fixed employee - get weekly schedule
        const { data: schedule } = await supabase
          .from('employee_schedules')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        console.log(`[get-availability] Employee ${employee.name} schedule for day ${dayOfWeek}:`, schedule);

        if (!schedule || !schedule.is_working) {
          console.log(`[get-availability] Employee ${employee.name} doesn't work on this day`);
          continue;
        }

        employeeStart = schedule.start_time;
        employeeEnd = schedule.end_time;
        breakStart = schedule.break_start;
        breakEnd = schedule.break_end;
      } else {
        // Autonomous - get availability for specific date
        const { data: availability } = await supabase
          .from('employee_availability')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('available_date', date)
          .maybeSingle();

        if (!availability) {
          console.log(`[get-availability] Autonomous employee ${employee.name} has no availability for this date`);
          continue;
        }

        employeeStart = availability.start_time;
        employeeEnd = availability.end_time;
        breakStart = availability.break_start;
        breakEnd = availability.break_end;
      }

      if (!employeeStart || !employeeEnd) {
        console.log(`[get-availability] Employee ${employee.name} has no start/end time configured`);
        continue;
      }

      console.log(`[get-availability] Employee ${employee.name} hours: ${employeeStart} - ${employeeEnd}, break: ${breakStart} - ${breakEnd}`);

      // 8. Get employee-specific blocked slots
      const { data: employeeBlocks } = await supabase
        .from('blocked_slots')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('blocked_date', date);

      // Check if entire day is blocked
      if (employeeBlocks && employeeBlocks.some(b => !b.start_time)) {
        console.log(`[get-availability] Employee ${employee.name} has entire day blocked`);
        continue;
      }

      // 9. Get existing bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, duration_minutes')
        .eq('employee_id', employee.id)
        .eq('booking_date', date)
        .in('booking_status', ['pending', 'confirmed']);

      // 10. Calculate available time range
      // Intersect business hours with employee hours
      const businessOpen = businessHours.open_time || '08:00';
      const businessClose = businessHours.close_time || '18:00';

      const effectiveStart = timeToMinutes(employeeStart) > timeToMinutes(businessOpen) 
        ? employeeStart 
        : businessOpen;
      const effectiveEnd = timeToMinutes(employeeEnd) < timeToMinutes(businessClose) 
        ? employeeEnd 
        : businessClose;

      console.log(`[get-availability] Effective hours for ${employee.name}: ${effectiveStart} - ${effectiveEnd}`);

      // 11. Generate slots
      const startMinutes = timeToMinutes(effectiveStart);
      const endMinutes = timeToMinutes(effectiveEnd);

      for (let time = startMinutes; time + serviceDuration <= endMinutes; time += slotDuration) {
        const slotTime = minutesToTime(time);
        const slotEndTime = time + serviceDuration;

        // Check minimum advance time for today (using Brazil timezone)
        const nowBrazil = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        const [todayBrazil, timeBrazil] = nowBrazil.split(' ');
        if (date === todayBrazil) {
          const [hours, minutes] = timeBrazil.split(':').map(Number);
          const nowMinutes = hours * 60 + minutes;
          console.log(`[get-availability] Today check - Brazil time: ${timeBrazil}, slot: ${minutesToTime(time)}, min advance: ${minAdvanceHours}h`);
          if (time < nowMinutes + (minAdvanceHours * 60)) {
            continue;
          }
        }

        // Check if slot overlaps with break
        if (breakStart && breakEnd) {
          const breakStartMin = timeToMinutes(breakStart);
          const breakEndMin = timeToMinutes(breakEnd);
          if (time < breakEndMin && slotEndTime > breakStartMin) {
            continue;
          }
        }

        // Check if slot overlaps with blocked times
        let isBlocked = false;
        
        // Company-wide blocks
        for (const block of companyBlocks || []) {
          if (block.start_time && block.end_time) {
            const blockStart = timeToMinutes(block.start_time);
            const blockEnd = timeToMinutes(block.end_time);
            if (time < blockEnd && slotEndTime > blockStart) {
              isBlocked = true;
              break;
            }
          }
        }

        // Employee-specific blocks
        if (!isBlocked) {
          for (const block of employeeBlocks || []) {
            if (block.start_time && block.end_time) {
              const blockStart = timeToMinutes(block.start_time);
              const blockEnd = timeToMinutes(block.end_time);
              if (time < blockEnd && slotEndTime > blockStart) {
                isBlocked = true;
                break;
              }
            }
          }
        }

        if (isBlocked) continue;

        // Check if slot overlaps with existing bookings
        let hasConflict = false;
        for (const booking of bookings || []) {
          const bookingStart = timeToMinutes(booking.booking_time);
          const bookingEnd = bookingStart + booking.duration_minutes;
          if (time < bookingEnd && slotEndTime > bookingStart) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) continue;

        // Slot is available!
        employeeSlots.push(slotTime);
        allSlots.push({
          time: slotTime,
          employee_id: employee.id,
          employee_name: employee.name,
        });
      }

      // Add to availability by employee
      if (employeeSlots.length > 0) {
        availabilityByEmployee.push({
          employee_id: employee.id,
          employee_name: employee.name,
          slots: employeeSlots,
        });
      }
    }

    // Sort slots by time
    allSlots.sort((a, b) => a.time.localeCompare(b.time));

    console.log(`[get-availability] Found ${allSlots.length} total slots, ${availabilityByEmployee.length} employees with availability`);

    return new Response(
      JSON.stringify({ 
        slots: allSlots,
        availability: availabilityByEmployee
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[get-availability] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
