# Sistema de Controle Operacional de Máquinas e Operadores

Implementação MVP baseada no `DOCUMENTO_TECNICO.md`.

## Stack
- FastAPI
- SQLite
- SQLAlchemy
- JWT para autenticação

## Funcionalidades implementadas
- Autenticação (admin, operador, supervisor)
- Cadastro de usuários, máquinas e veículos
- Registro de jornada (saída/retorno)
- Registro de ordens de serviço com encerramento
- Registro de foto com geolocalização por serviço
- Registro de horímetro/quilometragem
- Sincronização de eventos offline com deduplicação
- Relatório diário
- Alertas de manutenção por limite de horímetro

## Como executar
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API sobe em `http://127.0.0.1:8000` e documentação em `/docs`.

### Usuário padrão
- login: `admin`
- senha: `admin123`

## Testes
```bash
pytest -q
```
