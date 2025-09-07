#!/bin/bash

# Script de inicio para producción en Render
echo "🚀 Iniciando HolaPage en modo producción..."

# Verificar que los archivos de build existan
if [ ! -d "dist" ]; then
    echo "❌ Error: Archivos de build no encontrados"
    echo "🔧 Ejecutando build de emergencia..."
    npm run build
fi

# Verificar variables de entorno críticas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

echo "🌍 Variables de entorno configuradas"
echo "📊 Iniciando servidor en puerto: ${PORT:-5000}"

# Verificar base de datos antes de iniciar
echo "🗃️ Verificando base de datos..."
if [ -f "setup-database.js" ]; then
    chmod +x setup-database.js
    node setup-database.js || echo "⚠️ Base de datos ya configurada o error menor"
else
    echo "⚠️ Script de configuración no encontrado, continuando..."
fi

# Iniciar la aplicación
exec npm start