# Dockerfile para despliegue en Render u otros servicios
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    bash \
    curl \
    postgresql-client

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Copiar scripts de instalación e inicio
COPY install-dependencies.sh ./
COPY render-build.sh ./
COPY render-start.sh ./

# Hacer ejecutables los scripts
RUN chmod +x install-dependencies.sh render-build.sh render-start.sh

# Copiar código fuente
COPY . .

# Instalar dependencias
RUN ./install-dependencies.sh

# Construir la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["./render-start.sh"]