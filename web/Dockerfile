# ============================================
# Ceres Conecta Hub — Dashboard Web (Next.js)
# Dockerfile Multi-Stage otimizado para baixa memória
# ============================================

# ---- Stage 1: Instalar dependências ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- Stage 2: Build de produção ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Desabilitar telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build de produção com output standalone limitando memória para 512MB
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# ---- Stage 3: Imagem de produção mínima ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Limitar memória do Node.js para 256MB
ENV NODE_OPTIONS="--max-old-space-size=256"

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar apenas os arquivos necessários para rodar
COPY --from=builder /app/public ./public

# Ajustar permissões do cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar o build standalone (inclui server.js e dependências mínimas)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
