/**
 * Script para migrar las contraseñas en texto plano a versiones seguras con bcrypt
 * 
 * Este script se puede ejecutar manualmente desde un componente administrativo
 * o como una tarea programada para asegurar que todas las contraseñas estén cifradas.
 */

import { migrateAllPlainPasswords, checkPasswordSecurityStatus } from './passwordMigrationUtil';

/**
 * Ejecuta la migración de contraseñas y muestra estadísticas
 */
export const runPasswordMigration = async (): Promise<{
  success: boolean;
  message: string;
  beforeMigration?: ReturnType<typeof checkPasswordSecurityStatus>;
  afterMigration?: ReturnType<typeof checkPasswordSecurityStatus>;
  migrationStats?: ReturnType<typeof migrateAllPlainPasswords>;
}> => {
  try {
    console.log('Iniciando proceso de migración de contraseñas...');
    
    // Verificar el estado actual de seguridad
    const beforeStats = await checkPasswordSecurityStatus();
    console.log('Estado de seguridad antes de la migración:', beforeStats);
    
    // Si todas las contraseñas ya están seguras, salir
    if (beforeStats.plainPasswordUsers === 0) {
      return {
        success: true,
        message: '¡Todas las contraseñas ya están cifradas con bcrypt!',
        beforeMigration: beforeStats
      };
    }
    
    // Ejecutar la migración
    console.log(`Migrando ${beforeStats.plainPasswordUsers} contraseñas en texto plano...`);
    const migrationStats = await migrateAllPlainPasswords();
    
    // Verificar el estado después de la migración
    const afterStats = await checkPasswordSecurityStatus();
    console.log('Estado de seguridad después de la migración:', afterStats);
    
    // Determinar si fue exitoso
    const success = afterStats.plainPasswordUsers === 0;
    const message = success 
      ? `¡Migración completada! Se cifraron ${migrationStats.migratedUsers} contraseñas.`
      : `Migración parcial: ${migrationStats.migratedUsers} contraseñas cifradas, pero ${afterStats.plainPasswordUsers} quedaron en texto plano.`;
    
    return {
      success,
      message,
      beforeMigration: beforeStats,
      afterMigration: afterStats,
      migrationStats
    };
    
  } catch (error) {
    console.error('Error durante la migración de contraseñas:', error);
    return {
      success: false,
      message: `Error durante la migración: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Si este script se ejecuta directamente, iniciar la migración
if (require.main === module) {
  runPasswordMigration()
    .then(result => console.log('Resultado de la migración:', result))
    .catch(error => console.error('Error no controlado:', error));
}
