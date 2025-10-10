# Etapa 1: Build
# REBUILD 2025-01-10 15:17 - Category field fix
FROM node:18-alpine AS build
WORKDIR /app

# Copiar package.json
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Build argument para API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN npm run build

# Etapa 2: Runtime con Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remover contenido por defecto
RUN rm -rf ./*

# Copiar build desde etapa anterior
COPY --from=build /app/dist .

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
