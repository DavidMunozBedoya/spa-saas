# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

# Instalar dependencias del sistema necesarias para paquetes nativos
RUN apk add --no-cache build-base python3

# Instalar dependencias incluyendo devDependencies para el build
RUN pnpm install --frozen-lockfile

COPY . .

# Forzar la generación de tipos de Prisma o similares si existieran, y build
RUN pnpm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
