#!/bin/bash

# Instalación completa de dependencias para despliegue
echo "🔧 Instalando dependencias del proyecto HolaPage..."

# Instalar Node.js si no está disponible (en caso de contenedores limpiós)
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar versiones
echo "📋 Versiones instaladas:"
node --version
npm --version

# Limpiar cache de npm por si acaso
echo "🧹 Limpiando cache..."
npm cache clean --force

# Instalar dependencias de producción Y desarrollo (necesarias para build)
echo "📦 Instalando todas las dependencias..."
npm install --production=false

# Verificar que todas las dependencias críticas estén instaladas
echo "✅ Verificando instalación..."
npm list --depth=0

echo "✅ ¡Instalación completada exitosamente!"