# — Build —
FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY tsconfig.json ./
COPY src/ src/
COPY public/ public/

RUN bun test && bun run build

# — Serve —
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

RUN caddy validate --config /etc/caddy/Caddyfile

HEALTHCHECK --interval=30s --timeout=3s --retries=2 \
  CMD wget -qO /dev/null http://localhost:80/ || exit 1

EXPOSE 80 443
