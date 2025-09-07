#!/bin/bash

# Script de construcción y configuración para Render
echo "🚀 Iniciando proceso de build para Render..."

# Hacer ejecutable el script de instalación
chmod +x install-dependencies.sh

# Ejecutar instalación de dependencias
echo "📦 Ejecutando instalación de dependencias..."
./install-dependencies.sh

# Ejecutar push de base de datos (crear tablas)
echo "🗃️ Configurando base de datos..."
npm run db:push --force

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Inicializar datos por defecto en la base de datos
echo "🌱 Inicializando datos de base de datos..."
NODE_ENV=production npx tsx server/init-database.ts

echo "✅ ¡Build completado exitosamente!"
echo "🎉 La aplicación está lista para producción"