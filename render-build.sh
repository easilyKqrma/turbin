#!/bin/bash

# Script de construcción y configuración para Render
echo "🚀 Iniciando proceso de build para Render..."

# Hacer ejecutable el script de instalación
chmod +x install-dependencies.sh

# Ejecutar instalación de dependencias
echo "📦 Ejecutando instalación de dependencias..."
./install-dependencies.sh

# Construir la aplicación PRIMERO
echo "🔨 Construyendo aplicación..."
npm run build

# Configurar base de datos de manera robusta
echo "🗃️ Configurando base de datos..."
chmod +x setup-database.js
node setup-database.js

echo "✅ ¡Build completado exitosamente!"
echo "🎉 La aplicación está lista para producción"