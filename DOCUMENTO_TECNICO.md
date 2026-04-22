# Documento Técnico — Sistema de Controle Operacional de Máquinas e Operadores

## 1. Visão geral

Este documento descreve os requisitos, funcionalidades, regras de negócio, dados e componentes técnicos de um sistema móvel e administrativo para controle operacional de máquinas, veículos e operadores em ambiente de campo, com foco principal em atividades rurais e operações externas.

A solução tem como objetivo registrar saídas, serviços executados, retornos, tempos de trabalho, uso de máquinas, localização aproximada das atividades e geração de relatórios gerenciais.

---

## 2. Objetivo do sistema

O sistema deve permitir que a gestão acompanhe, de forma organizada e auditável, a rotina diária dos operadores e o uso dos equipamentos. Ele deve reduzir controles manuais, facilitar a apuração de horas trabalhadas, apoiar manutenção preventiva e gerar relatórios de produtividade e operação.

---

## 3. Escopo

### 3.1 O que o sistema deve fazer

* Autenticar operadores e administradores.
* Registrar início e fim de jornada.
* Registrar saída da garagem e retorno à garagem.
* Registrar máquina ou veículo utilizado em cada jornada.
* Registrar ordens de serviço e atividades executadas.
* Permitir encerramento e troca de serviço durante o dia.
* Capturar data e hora automaticamente.
* Capturar geolocalização em momentos específicos, principalmente em fotos.
* Permitir funcionamento offline com sincronização posterior.
* Gerar relatórios por operador, máquina, data e período.
* Acompanhar horas trabalhadas e indicativos para manutenção.
* Controlar horímetro de máquinas e quilometragem de veículos.

### 3.2 O que o sistema não deve fazer na primeira versão

* Rastreamento contínuo da localização do operador durante todo o dia.
* Integração complexa com hardware embarcado em todas as máquinas.
* Controle avançado de telemetria em tempo real.
* Automação completa da manutenção sem dados mínimos de uso.

---

## 4. Perfis de usuário

### 4.1 Operador

Responsável por:

* Entrar no sistema.
* Selecionar a máquina ou veículo.
* Registrar início e término de serviço.
* Tirar fotos de comprovação quando necessário.
* Informar dados manuais como horímetro ou quilometragem.
* Encerrar o dia de trabalho.

### 4.2 Administrador

Responsável por:

* Cadastrar operadores, máquinas e veículos.
* Acompanhar o painel de controle.
* Consultar relatórios.
* Validar registros.
* Monitorar horas, uso e manutenção.

### 4.3 Supervisor/Gestor

Responsável por:

* Acompanhar produtividade da equipe.
* Analisar serviços em aberto e encerrados.
* Verificar localizações registradas.
* Gerar relatórios de acompanhamento e prestação de contas.

---

## 5. Requisitos funcionais

### RF01 — Autenticação de usuário

O sistema deve permitir login com identificação individual do operador ou administrador.

### RF02 — Cadastro de operadores

O administrador deve cadastrar operadores com nome, foto, função e credenciais de acesso.

### RF03 — Cadastro de máquinas e veículos

O sistema deve permitir cadastrar equipamentos e veículos com identificação própria.

### RF04 — Seleção do equipamento em uso

O operador deve informar qual máquina ou veículo está utilizando no momento da saída.

### RF05 — Registro de saída da garagem

O sistema deve registrar automaticamente a hora de saída da garagem.

### RF06 — Registro de chegada ao serviço

O operador deve registrar o início do trabalho no local de serviço.

### RF07 — Registro de encerramento de serviço

O operador deve encerrar uma ordem de serviço quando concluir a atividade.

### RF08 — Registro de múltiplos serviços no mesmo dia

O sistema deve permitir que um operador execute mais de um serviço no mesmo dia.

### RF09 — Registro de retorno à garagem

O sistema deve registrar o horário de retorno ao final do expediente.

### RF10 — Captura de foto com geolocalização

O sistema deve permitir o envio de fotos com dados de localização associados.

### RF11 — Captura automática de data e hora

Toda ação registrada deve carregar data e hora automaticamente.

### RF12 — Funcionamento offline

O aplicativo deve armazenar dados localmente quando não houver internet.

### RF13 — Sincronização posterior

Ao detectar conexão, o aplicativo deve sincronizar automaticamente os dados pendentes.

### RF14 — Controle de horímetro

O operador deve informar o horímetro inicial e final da máquina, quando aplicável.

### RF15 — Controle de quilometragem

Para veículos, o sistema deve registrar quilometragem inicial e final.

### RF16 — Painel administrativo

O administrador deve visualizar o resumo do dia e os registros por operador, máquina e serviço.

### RF17 — Relatórios operacionais

O sistema deve emitir relatórios por período, operador, máquina e tipo de atividade.

### RF18 — Alertas de manutenção

O sistema deve sinalizar quando uma máquina atingir limite de horas para troca de óleo ou manutenção.

### RF19 — Histórico de utilização

O sistema deve manter histórico de uso por equipamento e por operador.

### RF20 — Controle de horas extras

O sistema deve apurar tempo de trabalho, pausas e possíveis horas extras.

---

## 6. Regras de negócio

### RN01 — Identificação do operador

Cada registro deve estar vinculado a um operador autenticado.

### RN02 — Equipamento vinculado ao serviço

Todo serviço deve estar associado a uma máquina ou veículo específico.

### RN03 — Data e hora automáticas

A data e a hora devem ser obtidas automaticamente do dispositivo.

### RN04 — Localização apenas em eventos específicos

A localização deve ser capturada apenas em ações pontuais, como início de serviço, fotos e encerramento, evitando rastreamento contínuo.

### RN05 — Registro manual obrigatório em determinados campos

Horímetro, quilometragem e observações técnicas devem ser preenchidos manualmente quando exigido.

### RN06 — Sincronização em atraso

Registros feitos offline devem ser salvos localmente e enviados quando houver internet.

### RN07 — Validação de máquina em uso

O sistema deve impedir ou alertar o uso de máquina fora da condição prevista de operação, como limite de horas de manutenção.

### RN08 — Controle de jornada

O sistema deve calcular tempo entre saída, início do serviço, pausas, encerramento e retorno.

### RN09 — Arquivamento histórico

Os dados devem permanecer acessíveis para consulta histórica e auditoria.

---

## 7. Fluxo operacional

### 7.1 Fluxo do operador

1. O operador abre o aplicativo.
2. Faz login.
3. Seleciona a máquina ou veículo.
4. Registra a saída da garagem.
5. Chega ao local e inicia o serviço.
6. Pode registrar fotos e observações.
7. Finaliza o serviço.
8. Se houver outro serviço, inicia um novo registro.
9. No fim do dia, registra o retorno à garagem.
10. O sistema salva e sincroniza os dados.

### 7.2 Fluxo do administrador

1. Acessa o painel administrativo.
2. Visualiza operadores em atividade.
3. Consulta detalhes por máquina, operador ou data.
4. Emite relatórios.
5. Acompanha alertas de manutenção.
6. Audita registros e histórico.

---

## 8. Telas do sistema

### 8.1 Tela de login

* Campo de usuário.
* Campo de senha.
* Botão de acesso.
* Recuperação de senha, se necessário.

### 8.2 Tela inicial do operador

* Nome do operador.
* Máquina atualmente selecionada.
* Botões para iniciar serviço, registrar foto, encerrar serviço e finalizar dia.

### 8.3 Tela de seleção de máquina

* Lista de equipamentos disponíveis.
* Identificação por nome, modelo, número interno, placa ou outra referência.

### 8.4 Tela de ordem de serviço

* Dados do serviço.
* Local da atividade.
* Horário automático.
* Foto opcional ou obrigatória.
* Observações.

### 8.5 Tela de encerramento do dia

* Horímetro final ou quilometragem final.
* Observações.
* Confirmação de retorno à garagem.

### 8.6 Painel administrativo

* Resumo diário.
* Lista de operadores.
* Lista de máquinas.
* Serviços abertos e encerrados.
* Alertas de manutenção.
* Relatórios exportáveis.

### 8.7 Tela de relatórios

* Filtros por período.
* Filtros por operador.
* Filtros por máquina.
* Totais de horas, serviços e uso.

---

## 9. Estrutura de dados

### 9.1 Entidades principais

#### Operador

* id
* nome
* foto
* função
* login
* senha
* status

#### Máquina

* id
* nome
* tipo
* modelo
* cor
* número interno
* status
* horímetro atual
* limite de manutenção

#### Veículo

* id
* placa
* tipo
* modelo
* status
* quilometragem atual

#### Serviço

* id
* operador_id
* máquina_id ou veículo_id
* data
* hora_inicio
* hora_fim
* local
* observações
* status

#### Registro de foto

* id
* serviço_id
* imagem
* latitude
* longitude
* data_hora

#### Jornada

* id
* operador_id
* data
* hora_saida
* hora_retorno
* tempo_total
* pausa_almoço
* hora_extra

#### Manutenção

* id
* máquina_id
* tipo
* data_prevista
* data_realizada
* horas_acumuladas
* observações

---

## 10. Requisitos não funcionais

### RNF01 — Usabilidade

A interface deve ser simples, objetiva e adaptada para uso no celular em campo.

### RNF02 — Desempenho

O sistema deve registrar eventos com rapidez, mesmo em conexões instáveis.

### RNF03 — Disponibilidade

O aplicativo deve continuar funcionando sem internet e sincronizar depois.

### RNF04 — Segurança

O acesso deve ser controlado por autenticação e perfis de usuário.

### RNF05 — Privacidade

A localização deve ser coletada apenas quando houver necessidade operacional explícita.

### RNF06 — Escalabilidade

A estrutura deve permitir inclusão futura de mais operadores, máquinas e unidades.

### RNF07 — Manutenibilidade

O sistema deve ser modular para facilitar ajustes e novas funcionalidades.

### RNF08 — Auditoria

Todos os eventos relevantes devem ser registrados com data, hora e usuário.

---

## 11. Requisitos técnicos sugeridos

### 11.1 Aplicativo móvel

* Aplicativo Android inicialmente.
* Possibilidade futura de versão iOS.
* Suporte a câmera, GPS e armazenamento local.

### 11.2 Back-end

* API para autenticação, sincronização e relatórios.
* Persistência centralizada dos dados.
* Registro de histórico e logs.

### 11.3 Banco de dados

* Armazenamento de usuários, máquinas, veículos, jornadas, serviços, fotos e manutenção.
* Relacionamentos entre operador, equipamento e serviço.

### 11.4 Sincronização

* Salvar eventos localmente quando offline.
* Reenviar dados pendentes quando houver internet.
* Evitar duplicidade de registros.

---

## 12. Relatórios esperados

O sistema deve permitir geração de relatórios como:

* Relatório diário de operações.
* Relatório por operador.
* Relatório por máquina.
* Relatório de horas trabalhadas.
* Relatório de serviços executados.
* Relatório de uso por período.
* Relatório de manutenção e alertas.
* Relatório de localização por evento.

---

## 13. Critérios de aceitação

O sistema será considerado adequado quando conseguir:

* Registrar corretamente operadores, máquinas e serviços.
* Funcionar com internet e sem internet.
* Gerar relatórios confiáveis.
* Calcular tempo de atividade e retorno.
* Permitir acompanhamento gerencial sem rastreamento contínuo.
* Apoiar manutenção e controle operacional.

---

## 14. MVP sugerido

A primeira versão deve conter apenas o essencial:

* Login de operador.
* Cadastro de máquinas.
* Registro de saída e retorno.
* Ordem de serviço simples.
* Foto com localização.
* Horímetro ou quilometragem.
* Painel administrativo básico.
* Relatório diário simples.
* Sincronização offline/online.

---

## 15. Evoluções futuras

Após validação do MVP, o sistema pode evoluir com:

* Localizador dedicado por máquina.
* Monitoramento em tempo real.
* Alertas automáticos de manutenção mais precisos.
* Integração com sensores e telemetria.
* Dashboards em tempo real em tela grande.
* Integração com rastreamento por hardware embarcado.

---

## 16. Conclusão

Este sistema propõe uma solução prática para organização, controle e auditoria das atividades de campo, reduzindo controles manuais e ampliando a visibilidade da gestão. A proposta inicial prioriza simplicidade, viabilidade técnica e evolução gradual, começando com um MVP funcional e expandindo conforme a operação for validada.
