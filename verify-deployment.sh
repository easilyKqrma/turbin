#!/bin/bash

# Script para verificar que el despliegue está listo
echo "🔍 Verificando que el proyecto esté listo para desplegar..."

# Verificar archivos críticos
echo "📁 Verificando archivos necesarios..."
required_files=("package.json" "server/index.ts" "server/init-database.ts" "shared/schema.ts" "client/src/main.tsx")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - OK"
    else
        echo "❌ $file - FALTA"
        exit 1
    fi
done

# Verificar scripts de despliegue
deployment_scripts=("install-dependencies.sh" "render-build.sh" "render-start.sh")

for script in "${deployment_scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "✅ $script - OK y ejecutable"
    else
        echo "❌ $script - Falta o no es ejecutable"
        exit 1
    fi
done

# Verificar configuración Docker
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile - OK"
else
    echo "❌ Dockerfile - FALTA"
    exit 1
fi

# Verificar configuración de Render
if [ -f "render.yaml" ]; then
    echo "✅ render.yaml - OK"
else
    echo "❌ render.yaml - FALTA"  
    exit 1
fi

# Verificar documentación
if [ -f "DEPLOY-INSTRUCTIONS.md" ] && [ -f ".env.example" ]; then
    echo "✅ Documentación completa"
else
    echo "❌ Falta documentación"
    exit 1
fi

echo ""
echo "🎉 ¡VERIFICACIÓN COMPLETA!"
echo "✅ Tu proyecto está LISTO para desplegar en Render"
echo ""
echo "📋 Próximos pasos:"
echo "1. Subir código a GitHub"
echo "2. Crear Web Service en Render"
echo "3. Configurar variables de entorno (ver .env.example)"
echo "4. El despliegue se hará automáticamente"
echo ""
echo "📖 Ver DEPLOY-INSTRUCTIONS.md para detalles completos"