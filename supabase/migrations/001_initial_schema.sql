-- ============================================================
-- Sistema de Controle Operacional de Máquinas e Operadores
-- Migration 001: Schema Inicial
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'supervisor');
CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'inactive');
CREATE TYPE service_status AS ENUM ('open', 'finished');

-- ============================================================
-- Perfil do Usuário (vinculado ao Supabase Auth)
-- ============================================================
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'operator',
    function TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Máquinas
-- ============================================================
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    internal_number TEXT NOT NULL UNIQUE,
    status equipment_status NOT NULL DEFAULT 'available',
    hourmeter_current DOUBLE PRECISION NOT NULL DEFAULT 0,
    maintenance_limit DOUBLE PRECISION NOT NULL DEFAULT 250,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Veículos
-- ============================================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL,
    model TEXT NOT NULL,
    status equipment_status NOT NULL DEFAULT 'available',
    mileage_current DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Jornadas (saída/retorno da garagem)
-- ============================================================
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES users_profile(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    garage_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    garage_return_at TIMESTAMPTZ,
    lunch_break_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Ordens de Serviço
-- ============================================================
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES users_profile(id),
    machine_id UUID REFERENCES machines(id),
    vehicle_id UUID REFERENCES vehicles(id),
    journey_id UUID REFERENCES journeys(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    location TEXT,
    notes TEXT,
    status service_status NOT NULL DEFAULT 'open',
    hourmeter_initial DOUBLE PRECISION,
    hourmeter_final DOUBLE PRECISION,
    mileage_initial DOUBLE PRECISION,
    mileage_final DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_equipment CHECK (machine_id IS NOT NULL OR vehicle_id IS NOT NULL)
);

-- ============================================================
-- Registros de Foto com Geolocalização
-- ============================================================
CREATE TABLE photo_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Manutenções
-- ============================================================
CREATE TABLE maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id),
    maintenance_type TEXT NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    accumulated_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Eventos de Sincronização Offline (deduplicação)
-- ============================================================
CREATE TABLE sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    processed BOOLEAN NOT NULL DEFAULT true,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_journeys_operator ON journeys(operator_id);
CREATE INDEX idx_journeys_date ON journeys(date);
CREATE INDEX idx_service_orders_operator ON service_orders(operator_id);
CREATE INDEX idx_service_orders_machine ON service_orders(machine_id);
CREATE INDEX idx_service_orders_vehicle ON service_orders(vehicle_id);
CREATE INDEX idx_service_orders_date ON service_orders(date);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_photo_records_service ON photo_records(service_id);
CREATE INDEX idx_maintenances_machine ON maintenances(machine_id);
CREATE INDEX idx_sync_events_client_id ON sync_events(client_event_id);

-- ============================================================
-- Trigger para updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_profile_updated BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_machines_updated BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_journeys_updated BEFORE UPDATE ON journeys
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_service_orders_updated BEFORE UPDATE ON service_orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_maintenances_updated BEFORE UPDATE ON maintenances
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
