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

# Iniciar la aplicación
exec npm start