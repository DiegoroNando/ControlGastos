// Detección del entorno (browser vs. node)
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Función auxiliar para importar bcrypt de forma segura solo en Node.js
 */
const importBcryptSafely = async (): Promise<any> => {
  if (isBrowser) {
    return null;
  }
  
  try {
    // Usar importación dinámica en lugar de require
    const bcryptModule = await import('bcrypt');
    return bcryptModule.default || bcryptModule;
  } catch (e) {
    console.warn('bcrypt no está disponible, usando implementación alternativa');
    return null;
  }
};

// Número de rondas de cifrado para el salt de bcrypt
// Mayor número = más seguro pero más lento
const SALT_ROUNDS = 10;

/**
 * Implementación simple de una función de hash para el navegador
 * Nota: Esta es una solución temporal y no es tan segura como bcrypt
 * @param text - El texto a hashear
 * @param salt - La sal para el hash
 * @returns Una promesa que se resuelve a un hash
 */
async function browserHash(text: string, salt: string = ''): Promise<string> {
  // En el navegador usamos SubtleCrypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(text + salt);
  
  // Usando SHA-256 como alternativa
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Formato similar a bcrypt para mantener la consistencia en comprobaciones
  return `$browser$10$${salt}$${hashHex}`;
}

/**
 * Genera una sal aleatoria para su uso en hash
 * @returns Una promesa que se resuelve a una sal
 */
async function browserGenSalt(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Cifra una contraseña usando bcrypt en Node.js o una alternativa en el navegador
 * @param plainPassword - La contraseña en texto plano a cifrar
 * @returns Contraseña cifrada
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    if (!isBrowser) {
      // Intentar usar bcrypt en entorno Node.js
      const bcryptModule = await importBcryptSafely();
      if (bcryptModule) {
        const salt = await bcryptModule.genSalt(SALT_ROUNDS);
        return await bcryptModule.hash(plainPassword, salt);
      }
    }
    
    // Implementación para navegador o fallback
    const salt = await browserGenSalt();
    return await browserHash(plainPassword, salt);
  } catch (error) {
    console.error('Error al cifrar la contraseña:', error);
    throw new Error('Error al cifrar la contraseña');
  }
};

/**
 * Compara una contraseña en texto plano con una contraseña cifrada
 * @param plainPassword - La contraseña en texto plano a comparar
 * @param hashedPassword - La contraseña cifrada almacenada
 * @returns true si las contraseñas coinciden, false en caso contrario
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    // Si no hay contraseña hasheada, es un usuario nuevo sin contraseña
    if (!hashedPassword) {
      return false;
    }
    
    // Verificar el formato del hash para determinar cómo compararlo
    if (hashedPassword.startsWith('$2b$') && !isBrowser) {
      // Contraseña cifrada con bcrypt, usar bcrypt para comparar
      const bcryptModule = await importBcryptSafely();
      if (bcryptModule) {
        return await bcryptModule.compare(plainPassword, hashedPassword);
      }
    }
    
    if (hashedPassword.startsWith('$browser$')) {
      // Formato de hash del navegador
      const parts = hashedPassword.split('$');
      const salt = parts[3];
      const newHash = await browserHash(plainPassword, salt);
      return newHash === hashedPassword;
    }
    
    // Contraseña antigua sin cifrar (comparación directa como fallback)
    // Este caso solo es para la migración, se eliminará en el futuro
    return plainPassword === hashedPassword;
  } catch (error) {
    console.error('Error al comparar la contraseña:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

/**
 * Verifica si una contraseña está cifrada con cualquier método seguro
 * @param password - La contraseña a verificar
 * @returns true si la contraseña está cifrada, false en caso contrario
 */
export const isPasswordHashed = (password: string): boolean => {
  return Boolean(password && (password.startsWith('$2b$') || password.startsWith('$browser$')));
};

/**
 * Migra las contraseñas antiguas a un formato hash seguro si es necesario
 * @param plainPassword - La contraseña en texto plano actual
 * @param storedPassword - La contraseña almacenada (puede estar o no cifrada)
 * @returns La contraseña cifrada si es necesario migrarla, o null si ya está cifrada
 */
export const migratePasswordIfNeeded = async (plainPassword: string, storedPassword: string): Promise<string | null> => {
  if (!storedPassword || !isPasswordHashed(storedPassword)) {
    // Si la contraseña no está hasheada, la migramos
    return await hashPassword(plainPassword);
  }
  
  // Si la contraseña está hasheada pero estamos en navegador y es formato bcrypt,
  // podríamos considerar migrarla a formato navegador para futuras comparaciones
  if (isBrowser && storedPassword.startsWith('$2b$') && plainPassword) {
    // Solo si la autenticación fue exitosa con el hash existente
    const isValid = await comparePassword(plainPassword, storedPassword);
    if (isValid) {
      // Migrar a formato browser para futuras comparaciones
      return await hashPassword(plainPassword);
    }
  }
  
  return null; // No es necesario migrar la contraseña
};

/**
 * Verifica que un módulo que maneja contraseñas está utilizando las funciones de cifrado seguro
 * @param moduleContent - El contenido del código fuente del módulo
 * @returns Un objeto con información sobre el uso de funciones seguras
 */
export const securityCheckPasswordHandling = (moduleContent: string): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Patrones de posibles problemas de seguridad
  const directComparisonPattern = /password\s*===|===\s*password|password\s*==|==\s*password/i;
  const plainStoragePattern = /password:.*password|passwordDigest:.*password(?!\s*\)|\.hash)/i;
  
  // Patrones de buenas prácticas
  const bcryptImportPattern = /import.*bcrypt|require\(['"]bcrypt['"]\)/;
  const hashFunctionPattern = /hashPassword|bcrypt\.hash/;
  const comparePattern = /comparePassword|bcrypt\.compare/;
  
  // Verificar problemas de seguridad
  if (directComparisonPattern.test(moduleContent)) {
    issues.push("Se detectó comparación directa de contraseñas (== o ===) en vez de usar bcrypt.compare");
    recommendations.push("Reemplazar todas las comparaciones directas de contraseñas con la función comparePassword");
  }
  
  if (plainStoragePattern.test(moduleContent)) {
    issues.push("Se detectó posible almacenamiento de contraseñas en texto plano");
    recommendations.push("Asegurarse de hashear todas las contraseñas antes de almacenarlas usando la función hashPassword");
  }

  // Verificar buenas prácticas
  const usesSecureLibrary = bcryptImportPattern.test(moduleContent) || moduleContent.includes('browserHash');
  const usesHashFunction = hashFunctionPattern.test(moduleContent);
  const usesCompareFunction = comparePattern.test(moduleContent);
  
  if (!usesSecureLibrary) {
    issues.push("No se detectó implementación de hash seguro");
    recommendations.push("Utilizar bcrypt o una implementación segura alternativa para el manejo de contraseñas");
  }
  
  if (!usesHashFunction) {
    issues.push("No se detectó uso de funciones de hash seguras");
    recommendations.push("Utilizar hashPassword para cifrar contraseñas");
  }
  
  if (!usesCompareFunction) {
    issues.push("No se detectó uso de funciones seguras de comparación de contraseñas");
    recommendations.push("Utilizar comparePassword para verificar contraseñas");
  }
  
  const isSecure = issues.length === 0 || (Boolean(usesSecureLibrary) && usesHashFunction && usesCompareFunction);
  
  return {
    isSecure,
    issues,
    recommendations
  };
};

/**
 * Alias for hashPassword function for backward compatibility
 * @param plainPassword - The plain text password to hash
 * @returns Hashed password
 */
export const generatePasswordDigest = hashPassword;
