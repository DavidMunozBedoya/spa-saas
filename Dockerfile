# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc ./


# Instalar dependencias del sistema necesarias para compilar paquetes nativos (como bcrypt)
RUN apk add --no-cache build-base python3

# Configurar pnpm para que no use enlaces simbólicos que puedan fallar en ciertos entornos de Docker
RUN pnpm config set side-effects-cache false

# Instalar TODAS las deps (incluyendo devDependencies para compilar TypeScript)
RUN pnpm install --frozen-lockfile

COPY . .

# Compilar TypeScript a JavaScript
RUN pnpm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./


# Solo dependencias de producción para la imagen final
RUN pnpm install --frozen-lockfile --prod

# Copiar el código compilado desde el stage builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]