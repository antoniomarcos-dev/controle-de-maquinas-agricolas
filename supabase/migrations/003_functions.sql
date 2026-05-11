-- ============================================================
-- Migration 003: Database Functions
-- ============================================================

-- ============================================================
-- Finalizar Jornada: calcula tempo total e horas extras
-- ============================================================
CREATE OR REPLACE FUNCTION fn_finish_journey(
    p_journey_id UUID,
    p_lunch_break_minutes INTEGER DEFAULT 0
)
RETURNS journeys AS $$
DECLARE
    v_journey journeys;
    v_total_minutes INTEGER;
    v_overtime INTEGER;
BEGIN
    UPDATE journeys
    SET
        garage_return_at = now(),
        lunch_break_minutes = p_lunch_break_minutes
    WHERE id = p_journey_id
    RETURNING * INTO v_journey;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jornada não encontrada: %', p_journey_id;
    END IF;

    -- Calcula tempo total em minutos
    v_total_minutes := EXTRACT(EPOCH FROM (v_journey.garage_return_at - v_journey.garage_out_at)) / 60;
    
    -- Hora extra = tempo total - 8h - almoço
    v_overtime := GREATEST(0, v_total_minutes - 480 - p_lunch_break_minutes);

    UPDATE journeys
    SET overtime_minutes = v_overtime
    WHERE id = p_journey_id
    RETURNING * INTO v_journey;

    RETURN v_journey;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Finalizar Serviço: atualiza status e horímetro/km do equipamento
-- ============================================================
CREATE OR REPLACE FUNCTION fn_finish_service(
    p_service_id UUID,
    p_hourmeter_final DOUBLE PRECISION DEFAULT NULL,
    p_mileage_final DOUBLE PRECISION DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS service_orders AS $$
DECLARE
    v_service service_orders;
BEGIN
    UPDATE service_orders
    SET
        status = 'finished',
        finished_at = now(),
        hourmeter_final = COALESCE(p_hourmeter_final, hourmeter_final),
        mileage_final = COALESCE(p_mileage_final, mileage_final),
        notes = COALESCE(p_notes, notes)
    WHERE id = p_service_id
    RETURNING * INTO v_service;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serviço não encontrado: %', p_service_id;
    END IF;

    -- Atualiza horímetro da máquina
    IF v_service.machine_id IS NOT NULL AND p_hourmeter_final IS NOT NULL THEN
        UPDATE machines
        SET hourmeter_current = p_hourmeter_final
        WHERE id = v_service.machine_id;
    END IF;

    -- Atualiza quilometragem do veículo
    IF v_service.vehicle_id IS NOT NULL AND p_mileage_final IS NOT NULL THEN
        UPDATE vehicles
        SET mileage_current = p_mileage_final
        WHERE id = v_service.vehicle_id;
    END IF;

    RETURN v_service;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Alertas de Manutenção
-- ============================================================
CREATE OR REPLACE FUNCTION fn_maintenance_alerts()
RETURNS TABLE (
    machine_id UUID,
    machine_name TEXT,
    hourmeter_current DOUBLE PRECISION,
    maintenance_limit DOUBLE PRECISION,
    needs_maintenance BOOLEAN,
    hours_remaining DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.hourmeter_current,
        m.maintenance_limit,
        m.hourmeter_current >= m.maintenance_limit,
        GREATEST(0, m.maintenance_limit - m.hourmeter_current)
    FROM machines m
    WHERE m.status != 'inactive'
    ORDER BY (m.hourmeter_current / NULLIF(m.maintenance_limit, 0)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Relatório Diário
-- ============================================================
CREATE OR REPLACE FUNCTION fn_daily_report(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    report_date DATE,
    operators_active BIGINT,
    services_open BIGINT,
    services_finished BIGINT,
    total_services BIGINT,
    machines_in_use BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_date,
        (SELECT COUNT(DISTINCT j.operator_id) FROM journeys j WHERE j.date = p_date),
        (SELECT COUNT(*) FROM service_orders so WHERE so.date = p_date AND so.status = 'open'),
        (SELECT COUNT(*) FROM service_orders so WHERE so.date = p_date AND so.status = 'finished'),
        (SELECT COUNT(*) FROM service_orders so WHERE so.date = p_date),
        (SELECT COUNT(DISTINCT so.machine_id) FROM service_orders so WHERE so.date = p_date AND so.machine_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Relatório por Operador em Período
-- ============================================================
CREATE OR REPLACE FUNCTION fn_operator_report(
    p_start_date DATE,
    p_end_date DATE,
    p_operator_id UUID DEFAULT NULL
)
RETURNS TABLE (
    operator_id UUID,
    operator_name TEXT,
    total_journeys BIGINT,
    total_services BIGINT,
    total_hours_worked DOUBLE PRECISION,
    total_overtime_minutes BIGINT,
    avg_services_per_day DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.name,
        (SELECT COUNT(*) FROM journeys j WHERE j.operator_id = up.id AND j.date BETWEEN p_start_date AND p_end_date),
        (SELECT COUNT(*) FROM service_orders so WHERE so.operator_id = up.id AND so.date BETWEEN p_start_date AND p_end_date),
        COALESCE(
            (SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(j.garage_return_at, now()) - j.garage_out_at)) / 3600)
             FROM journeys j WHERE j.operator_id = up.id AND j.date BETWEEN p_start_date AND p_end_date),
            0
        ),
        COALESCE(
            (SELECT SUM(j.overtime_minutes) FROM journeys j WHERE j.operator_id = up.id AND j.date BETWEEN p_start_date AND p_end_date),
            0
        ),
        COALESCE(
            (SELECT COUNT(*)::DOUBLE PRECISION / NULLIF((p_end_date - p_start_date + 1), 0)
             FROM service_orders so WHERE so.operator_id = up.id AND so.date BETWEEN p_start_date AND p_end_date),
            0
        )
    FROM users_profile up
    WHERE up.role = 'operator'
    AND (p_operator_id IS NULL OR up.id = p_operator_id)
    ORDER BY up.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Relatório por Máquina em Período
-- ============================================================
CREATE OR REPLACE FUNCTION fn_machine_report(
    p_start_date DATE,
    p_end_date DATE,
    p_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
    machine_id UUID,
    machine_name TEXT,
    internal_number TEXT,
    total_services BIGINT,
    total_hours_used DOUBLE PRECISION,
    hourmeter_current DOUBLE PRECISION,
    needs_maintenance BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.internal_number,
        (SELECT COUNT(*) FROM service_orders so WHERE so.machine_id = m.id AND so.date BETWEEN p_start_date AND p_end_date),
        COALESCE(
            (SELECT SUM(COALESCE(so.hourmeter_final, 0) - COALESCE(so.hourmeter_initial, 0))
             FROM service_orders so WHERE so.machine_id = m.id AND so.date BETWEEN p_start_date AND p_end_date AND so.status = 'finished'),
            0
        ),
        m.hourmeter_current,
        m.hourmeter_current >= m.maintenance_limit
    FROM machines m
    WHERE (p_machine_id IS NULL OR m.id = p_machine_id)
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Criar perfil automaticamente ao registrar novo usuário no Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'operator'::public.user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();
