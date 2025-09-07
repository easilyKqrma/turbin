# 🚀 Instrucciones de Despliegue para HolaPage

## 📋 Archivos Incluidos

Este proyecto incluye todos los archivos necesarios para desplegar en **Render** o cualquier otro servicio:

### Scripts de Despliegue:
- `install-dependencies.sh` - Instala TODAS las dependencias necesarias
- `render-build.sh` - Construye la aplicación y configura la base de datos
- `render-start.sh` - Inicia la aplicación en producción
- `Dockerfile` - Para despliegue con Docker
- `render.yaml` - Configuración específica para Render

## 🔧 Configuración en Render

### 1. Crear nuevo Web Service
- Ve a tu dashboard de Render
- Click en "New +" → "Web Service"
- Conecta tu repositorio de GitHub

### 2. Configuración del Build
```
Build Command: ./render-build.sh
Start Command: ./render-start.sh
Environment: Node
```

### 3. Variables de Entorno Requeridas
En Render, configura estas variables de entorno:

#### Base de Datos:
```
DATABASE_URL=postgresql://username:password@hostname:port/database
```

#### PayPal (obligatorias):
```
PAYPAL_CLIENT_ID=tu_client_id_de_paypal
PAYPAL_CLIENT_SECRET=tu_client_secret_de_paypal
PAYPAL_ENVIRONMENT=sandbox
```
*Cambiar a 'live' para producción*

#### Sistema:
```
NODE_ENV=production
PORT=5000
```

### 4. Base de Datos PostgreSQL
- Crear una base de datos PostgreSQL en Render o usar servicio externo
- Copiar la URL de conexión a la variable `DATABASE_URL`

## 🐳 Despliegue con Docker

Si prefieres usar Docker:

```bash
# Construir imagen
docker build -t holapage .

# Ejecutar contenedor
docker run -p 5000:5000 \
  -e DATABASE_URL="tu_database_url" \
  -e PAYPAL_CLIENT_ID="tu_paypal_id" \
  -e PAYPAL_CLIENT_SECRET="tu_paypal_secret" \
  -e PAYPAL_ENVIRONMENT="sandbox" \
  holapage
```

## ✅ Proceso Automático

Los scripts se encargan automáticamente de:

1. **Instalar TODAS las dependencias** (producción y desarrollo)
2. **Crear las tablas de la base de datos** (`npm run db:push`)
3. **Inicializar datos por defecto**:
   - Usuario admin (GProject/gproject0)
   - Usuarios de prueba (Free, Plus, Pro)
   - Emociones por defecto
   - Instrumentos de trading por defecto
4. **Construir la aplicación** para producción
5. **Iniciar el servidor** en el puerto correcto

## 🔐 Usuarios Creados Automáticamente

El sistema crea estos usuarios por defecto:

- **Admin**: GProject / gproject0
- **Free**: FreeUser / gproject0  
- **Plus**: PlusUser / gproject0
- **Pro**: ProUser / gproject0

## ⚠️ Notas Importantes

- Los scripts son **compatibles con Render, Heroku, Railway, y otros**
- La aplicación funcionará **completamente desde cero** en cualquier servidor
- **No olvides configurar las variables de entorno de PayPal** o el servidor no iniciará
- La base de datos se inicializa automáticamente con datos de prueba

## 🆘 Solución de Problemas

Si el despliegue falla:

1. Verificar que todas las variables de entorno estén configuradas
2. Revisar los logs del build para errores específicos
3. Asegurar que la base de datos PostgreSQL esté accesible
4. Verificar que los scripts tengan permisos de ejecución