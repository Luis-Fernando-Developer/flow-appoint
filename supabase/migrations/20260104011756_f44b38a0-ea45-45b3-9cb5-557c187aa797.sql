-- Adicionar coluna combo_id na tabela bookings
ALTER TABLE bookings 
ADD COLUMN combo_id uuid REFERENCES service_combos(id);

-- Tornar service_id opcional (pode ser combo OU serviço)
ALTER TABLE bookings 
ALTER COLUMN service_id DROP NOT NULL;

-- Garantir que ou service_id ou combo_id está preenchido
ALTER TABLE bookings 
ADD CONSTRAINT booking_has_service_or_combo 
CHECK (service_id IS NOT NULL OR combo_id IS NOT NULL);