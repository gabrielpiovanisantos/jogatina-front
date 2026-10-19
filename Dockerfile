# --- Build stage ---
FROM docker.io/library/node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O .env não entra no contexto de build (.dockerignore), então as variáveis do
# Vite são definidas aqui: URL relativa para passar pelo proxy do nginx e mock
# desligado para usar o backend real.
ENV VITE_API_URL=/ \
    VITE_USE_MOCK=false
RUN npm run build

# --- Runtime stage ---
FROM docker.io/library/nginx:1.27-alpine AS runtime

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# URL do backend para onde /api e /dashboard são proxeados.
# Sobrescreva em runtime: docker run -e BACKEND_URL=http://meu-backend:8080 ...
ENV BACKEND_URL=http://backend:8080

# Faz o entrypoint da imagem detectar o DNS interno do Docker/Podman em vez de
# usar um IP fixo (127.0.0.11 é específico do Docker; Podman usa outro).
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

EXPOSE 80

# 127.0.0.1 em vez de localhost: no Alpine, localhost resolve primeiro para ::1
# e o nginx só escuta em IPv4.
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
