-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: função para obter role do usuário autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM users_profile WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- users_profile
-- ============================================================
-- Todos autenticados podem ver perfis (necessário para selecionar operador)
CREATE POLICY "Perfis visíveis para todos autenticados"
    ON users_profile FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admins podem criar/atualizar perfis
CREATE POLICY "Admins podem criar perfis"
    ON users_profile FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "Admins podem atualizar perfis"
    ON users_profile FOR UPDATE
    TO authenticated
    USING (auth_user_role() = 'admin');

-- Usuários podem atualizar seu próprio perfil (foto, etc.)
CREATE POLICY "Usuário pode atualizar próprio perfil"
    ON users_profile FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ============================================================
-- machines
-- ============================================================
CREATE POLICY "Máquinas visíveis para todos autenticados"
    ON machines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins gerenciam máquinas"
    ON machines FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- Operadores podem atualizar status e horímetro
CREATE POLICY "Operadores atualizam horímetro"
    ON machines FOR UPDATE
    TO authenticated
    USING (auth_user_role() = 'operator');

-- ============================================================
-- vehicles
-- ============================================================
CREATE POLICY "Veículos visíveis para todos autenticados"
    ON vehicles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins gerenciam veículos"
    ON vehicles FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "Operadores atualizam quilometragem"
    ON vehicles FOR UPDATE
    TO authenticated
    USING (auth_user_role() = 'operator');

-- ============================================================
-- journeys
-- ============================================================
-- Operadores veem apenas suas próprias jornadas
CREATE POLICY "Operadores veem próprias jornadas"
    ON journeys FOR SELECT
    TO authenticated
    USING (
        operator_id = auth.uid()
        OR auth_user_role() IN ('admin', 'supervisor')
    );

-- Operadores criam suas próprias jornadas
CREATE POLICY "Operadores criam jornadas"
    ON journeys FOR INSERT
    TO authenticated
    WITH CHECK (operator_id = auth.uid());

-- Operadores atualizam suas próprias jornadas
CREATE POLICY "Operadores atualizam próprias jornadas"
    ON journeys FOR UPDATE
    TO authenticated
    USING (
        operator_id = auth.uid()
        OR auth_user_role() IN ('admin', 'supervisor')
    );

-- ============================================================
-- service_orders
-- ============================================================
CREATE POLICY "Operadores veem próprios serviços"
    ON service_orders FOR SELECT
    TO authenticated
    USING (
        operator_id = auth.uid()
        OR auth_user_role() IN ('admin', 'supervisor')
    );

CREATE POLICY "Operadores criam serviços"
    ON service_orders FOR INSERT
    TO authenticated
    WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Operadores atualizam próprios serviços"
    ON service_orders FOR UPDATE
    TO authenticated
    USING (
        operator_id = auth.uid()
        OR auth_user_role() IN ('admin', 'supervisor')
    );

-- ============================================================
-- photo_records
-- ============================================================
CREATE POLICY "Fotos visíveis para dono e gestores"
    ON photo_records FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = photo_records.service_id
            AND (so.operator_id = auth.uid() OR auth_user_role() IN ('admin', 'supervisor'))
        )
    );

CREATE POLICY "Operadores enviam fotos dos próprios serviços"
    ON photo_records FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = photo_records.service_id
            AND so.operator_id = auth.uid()
        )
    );

-- ============================================================
-- maintenances
-- ============================================================
CREATE POLICY "Manutenções visíveis para admins e supervisores"
    ON maintenances FOR SELECT
    TO authenticated
    USING (auth_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "Admins gerenciam manutenções"
    ON maintenances FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ============================================================
-- sync_events
-- ============================================================
CREATE POLICY "Usuários gerenciam sync events"
    ON sync_events FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Storage: bucket para fotos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Operadores fazem upload de fotos" ON storage.objects;
CREATE POLICY "Operadores fazem upload de fotos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'service-photos');

DROP POLICY IF EXISTS "Autenticados podem ver fotos" ON storage.objects;
CREATE POLICY "Autenticados podem ver fotos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'service-photos');
