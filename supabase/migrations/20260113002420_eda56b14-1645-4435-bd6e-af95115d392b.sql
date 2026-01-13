-- Force types refresh by adding comments to all tables
COMMENT ON TABLE public.services IS 'Business services offered to clients';
COMMENT ON TABLE public.employees IS 'Business employees who provide services';
COMMENT ON TABLE public.clients IS 'Client information for bookings';
COMMENT ON TABLE public.bookings IS 'Service appointments and reservations';
COMMENT ON TABLE public.rewards IS 'Reward programs for clients';
COMMENT ON TABLE public.client_rewards IS 'Rewards assigned to specific clients';
COMMENT ON TABLE public.business_hours IS 'Company operating hours per day';
COMMENT ON TABLE public.employee_schedules IS 'Employee working schedules';
COMMENT ON TABLE public.employee_availability IS 'Employee specific availability slots';
COMMENT ON TABLE public.employee_absences IS 'Employee vacation and leave records';
COMMENT ON TABLE public.blocked_slots IS 'Blocked time slots for scheduling';
COMMENT ON TABLE public.company_schedule_settings IS 'Company scheduling configuration';