-- ============================================================
-- Seed Data: Dados iniciais para desenvolvimento
-- ============================================================
-- NOTA: O admin é criado automaticamente pelo trigger on_auth_user_created
-- ao criar o primeiro usuário via Supabase Auth.
-- 
-- Para criar o admin no Supabase Dashboard:
-- 1. Vá em Authentication > Users > Add User
-- 2. Email: admin@ceresconecta.com
-- 3. Password: admin123
-- 4. Metadata: {"name": "Administrador", "role": "admin"}
--
-- Depois execute este seed para dados de exemplo:

-- Máquinas de exemplo
INSERT INTO machines (name, equipment_type, model, color, internal_number, hourmeter_current, maintenance_limit) VALUES
    ('Trator John Deere 6110J', 'trator', '6110J', 'Verde', 'TR-001', 180.5, 250),
    ('Trator New Holland T6', 'trator', 'T6.110', 'Azul', 'TR-002', 95.0, 250),
    ('Colheitadeira Case IH', 'colheitadeira', 'A8810', 'Vermelho', 'CO-001', 220.0, 300),
    ('Pulverizador Jacto', 'pulverizador', 'Uniport 3030', 'Branco', 'PU-001', 45.0, 200),
    ('Plantadeira Massey', 'plantadeira', 'MF 509', 'Vermelho', 'PL-001', 130.0, 250);

-- Veículos de exemplo
INSERT INTO vehicles (plate, vehicle_type, model, mileage_current) VALUES
    ('ABC-1234', 'pickup', 'Toyota Hilux 2023', 15000),
    ('DEF-5678', 'caminhão', 'VW Delivery 11.180', 42000),
    ('GHI-9012', 'utilitário', 'Fiat Strada', 8500);
