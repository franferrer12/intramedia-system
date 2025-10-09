# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copiar package.json
COPY frontend/package*.json ./
RUN npm install

# Copiar código fuente
COPY frontend .

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
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar script de entrada
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto
EXPOSE 80

# Iniciar nginx con script de entrada
CMD ["/docker-entrypoint.sh"]
