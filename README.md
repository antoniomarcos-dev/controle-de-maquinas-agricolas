# Ceres Conecta - Controle Operacional de Máquinas e Operadores

Este projeto é um sistema de controle operacional voltado para atividades agrícolas. Ele permite o monitoramento de jornadas de trabalho dos operadores, uso de máquinas/veículos, e gestão de ordens de serviço. 

A solução foi projetada para atuar tanto no escritório (via Dashboard) quanto em ambientes de campo sem internet (via Aplicativo Móvel com suporte a funcionamento offline e sincronização).

---

## 🚀 Arquitetura e Stack

O sistema é composto por três frentes principais:

1. **Dashboard Administrativo (`web/`)**: Desenvolvido em **Next.js** com **Tailwind CSS**. Focado na gestão de cadastros, visualização de relatórios e monitoramento da operação.
2. **Aplicativo Móvel (`mobile/`)**: Desenvolvido em **React Native (Expo)**. Focado na experiência do operador em campo, registrando início/fim de dia, trocas de máquina, geolocalização e apontamentos.
3. **Backend & Banco de Dados (`supabase/`)**: Utiliza **Supabase** (PostgreSQL, Auth e Storage) para banco de dados relacional em tempo real e autenticação.

## 📂 Estrutura do Projeto

```text
├── mobile/               # Aplicativo React Native (Expo)
├── web/                  # Dashboard Administrativo (Next.js - Otimizado para Vercel)
├── supabase/             # Migrations e configurações do banco de dados (Supabase)
├── .env.example          # Exemplo de variáveis de ambiente
└── DOCUMENTO_TECNICO.md  # Requisitos e regras de negócio detalhadas
```

---

## 🛠️ Passo a Passo: Do Início ao Fim

Siga as instruções abaixo para configurar e executar a plataforma completa, desde o banco de dados até as aplicações web e mobile.

### Pré-requisitos
- **Node.js** (v18+)
- **Conta na Vercel** (Para deploy do Dashboard Web)
- **Conta no Supabase** (ou Supabase CLI para rodar localmente)
- **Expo Go** instalado no smartphone (Android/iOS) para testar o app mobile.

---

### Passo 1: Configuração das Variáveis de Ambiente

Na raiz do projeto, crie o arquivo `.env` a partir do template disponibilizado (e caso haja algum `.env` na pasta mobile, siga a mesma estrutura):

```bash
cp .env.example .env
```
Abra o arquivo `.env` e preencha com as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...<sua-anon-key>
```
*Dica: Você encontra essas chaves acessando o painel do Supabase em Project Settings > API.*

---

### Passo 2: Configuração do Banco de Dados (Supabase)

Para preparar o banco de dados com as tabelas necessárias:

1. Acesse o **SQL Editor** no painel do Supabase.
2. Copie o conteúdo dos arquivos `.sql` localizados na pasta `supabase/migrations/` e execute-os em ordem cronológica.
3. Isso criará todas as tabelas (operadores, maquinas, registros) e configurará as regras de segurança (RLS).

---

### Passo 3: Fazendo Deploy do Dashboard na Vercel

A aplicação Web foi totalmente otimizada para rodar de forma serverless e edge na infraestrutura da Vercel, suportando funcionamento offline (PWA) e Turbopack.

1. Crie uma conta na Vercel (https://vercel.com) e vincule ao seu GitHub.
2. Suba este código para um repositório no seu GitHub.
3. No painel da Vercel, clique em **Add New... > Project** e importe o seu repositório.
4. Na tela de configuração de Deploy da Vercel:
   - **Framework Preset**: O Next.js será detectado automaticamente.
   - **Root Directory**: Clique em *Edit* e selecione a pasta `web`.
   - **Environment Variables**: Adicione as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do seu Supabase.
5. Clique em **Deploy**! A Vercel vai compilar o código em segundos e gerar o link público do seu sistema (com suporte PWA e Cache Offline embutido).

#### Rodando Localmente (Apenas para Desenvolvimento)
Caso precise modificar o código Web ou testar antes do deploy:
```bash
cd web
npm install
npm run dev
```
Acesse `http://localhost:3000`.

---

### Passo 4: Executando o Aplicativo Móvel (React Native / Expo)

O aplicativo móvel foi construído com Expo, facilitando a execução e testes físicos ou emuladores.

1. Navegue até a pasta `mobile`:
```bash
cd mobile
```
2. Instale as dependências:
```bash
npm install
```
3. Inicie o servidor do Expo:
```bash
npx expo start
```
4. **Como testar:**
   - **No dispositivo físico:** Instale o app "Expo Go" (App Store / Play Store). Escaneie o QR Code que aparece no terminal (ou na janela do navegador que o Expo abrir).
   - **No Emulador:** Pressione a tecla `a` (para Android) ou `i` (para iOS) no terminal, caso possua o Android Studio ou o Xcode configurados.

---

## 📖 Fluxo de Utilização Rápida

1. **Gestor (Web):** Acessa o Dashboard (`localhost:3000`), cadastra os Operadores, Máquinas/Veículos e acompanha a situação da frota em tempo real.
2. **Operador (Mobile):** Abre o app, seleciona seu nome, inicia o dia de trabalho e vincula a máquina que vai operar.
3. **Sincronização:** Se o operador estiver no campo sem internet, os apontamentos e atividades ficam salvas localmente no celular (Zustand + AsyncStorage). Assim que houver conexão, os dados são enviados silenciosamente para o Supabase e refletem instantaneamente no Dashboard Administrativo.

---

## 📄 Documentação Técnica
Para entender a fundo as regras de negócio, fluxos do banco de dados offline e os requisitos arquitetônicos detalhados, consulte o arquivo [DOCUMENTO_TECNICO.md](./DOCUMENTO_TECNICO.md).

## ⚖️ Licença
Este projeto é de uso restrito e exclusivo da **Ceres Conecta Hub**.
