#!/bin/bash

# =============================================================================
# GMETRICS PROJECT SETUP SCRIPT
# =============================================================================
# Este script inicializa completamente el proyecto Gmetrics
# Instala dependencias, configura la base de datos e inicia la aplicación

echo "🚀 Iniciando setup completo de Gmetrics..."
echo "=================================================="

# 1. Instalar todas las dependencias
echo "📦 Instalando dependencias de Node.js..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

# 2. Ejecutar migraciones de base de datos
echo ""
echo "🗃️  Configurando base de datos..."
npm run db:push --force
if [ $? -eq 0 ]; then
    echo "✅ Base de datos configurada correctamente"
else
    echo "❌ Error configurando base de datos"
    exit 1
fi

# 3. Mensaje final
echo ""
echo "🎉 ¡Setup completado exitosamente!"
echo "=================================================="
echo "🔧 Para iniciar el servidor de desarrollo:"
echo "   npm run dev"
echo ""
echo "🌐 La aplicación incluye:"
echo "   • Cuenta admin creada automáticamente"
echo "   • 3 cuentas de prueba (free, plus, pro)"
echo "   • Base de datos configurada"
echo "   • PayPal integrado"
echo "   • Páginas: /docs, /help, /contact"
echo ""
echo "📱 Contacto WhatsApp: +1 809 486 6678"
echo "📧 Email: metrics@gprojects.com"
echo "=================================================="