#!/usr/bin/env node

/**
 * Script de inicialización completo de base de datos para HolaPage
 * Este script crea las tablas y datos iniciales de manera robusta
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupDatabase() {
  console.log("🚀 Configurando base de datos HolaPage...");

  try {
    // 1. Ejecutar db:push para crear/actualizar tablas
    console.log("📊 Creando tablas de base de datos...");
    const pushCommand = 'npx drizzle-kit push --force';
    
    const { stdout: pushStdout, stderr: pushStderr } = await execAsync(pushCommand, {
      timeout: 60000, // 60 segundos timeout
      env: { ...process.env }
    });
    
    console.log("✅ Tablas de base de datos actualizadas");
    if (pushStdout) console.log("📋 Output:", pushStdout);
    if (pushStderr && !pushStderr.includes('No changes detected')) {
      console.log("⚠️ Advertencias:", pushStderr);
    }

    // 2. Ejecutar inicialización de datos
    console.log("🌱 Inicializando datos por defecto...");
    
    // Usar el servidor compilado si existe, sino usar tsx
    let initCommand;
    if (process.env.NODE_ENV === 'production') {
      initCommand = 'node dist/index.js --init-db-only';
    } else {
      initCommand = 'npx tsx server/init-database.ts';
    }

    const { stdout: initStdout } = await execAsync(initCommand, {
      timeout: 30000, // 30 segundos timeout
      env: { ...process.env }
    });
    
    console.log("📄 Resultado de inicialización:");
    console.log(initStdout);
    
    console.log("✅ ¡Base de datos configurada exitosamente!");
    
  } catch (error) {
    console.error("❌ Error configurando base de datos:", error.message);
    
    // Información adicional para debug
    if (error.stdout) {
      console.log("📤 stdout:", error.stdout);
    }
    if (error.stderr) {
      console.log("📥 stderr:", error.stderr);
    }
    
    // Reintentar solo el push de DB
    try {
      console.log("🔄 Reintentando solo la creación de tablas...");
      await execAsync('npx drizzle-kit push', { timeout: 30000 });
      console.log("✅ Tablas creadas en segundo intento");
    } catch (retryError) {
      console.error("❌ Falló también el segundo intento:", retryError.message);
      throw retryError;
    }
  }
}

// Solo ejecutar si se llama directamente
if (process.argv[1].endsWith('setup-database.js')) {
  setupDatabase().then(() => {
    console.log("🎉 Configuración completada");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Configuración falló:", error);
    process.exit(1);
  });
}

export { setupDatabase };