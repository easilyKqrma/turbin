#!/usr/bin/env node

// Script separado SOLO para inicializar la base de datos
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initDatabaseOnly() {
  try {
    console.log("🚀 Ejecutando SOLO inicialización de base de datos...");
    
    // Primero ejecutar db:push para asegurar que las tablas existan
    console.log("🗃️ Creando tablas en la base de datos...");
    const { stdout: pushOutput, stderr: pushError } = await execAsync('npx drizzle-kit push --force');
    
    if (pushError && !pushError.includes('No changes detected')) {
      console.log("Push output:", pushOutput);
      console.log("Push warnings/info:", pushError);
    }
    
    console.log("✅ Tablas creadas/verificadas exitosamente");
    
    // Ahora ejecutar la inicialización
    console.log("🌱 Inicializando datos por defecto...");
    const { stdout: initOutput } = await execAsync('NODE_ENV=production npx tsx server/init-database.ts');
    console.log(initOutput);
    
    console.log("✅ ¡Inicialización completada exitosamente!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error en inicialización:", error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1].endsWith('init-db-only.js')) {
  initDatabaseOnly();
}