/**
 * Utilidad para verificar la seguridad de las operaciones con contraseñas en todo el código
 */

import fs from 'fs';
import path from 'path';
import { securityCheckPasswordHandling } from '../services/passwordService';

// Archivos y directorios a ignorar
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.DS_Store'
];

// Extensiones de archivos a analizar
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Busca archivos de código recursivamente
 */
function findCodeFiles(dir: string): string[] {
  let results: string[] = [];
  
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    // Ignorar directorios y archivos excluidos
    if (IGNORED_PATHS.includes(file)) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      results = results.concat(findCodeFiles(filePath));
    } else if (CODE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      // Añadir archivos con extensiones de código
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Analiza un archivo en busca de posibles problemas de seguridad en el manejo de contraseñas
 */
function analyzeFile(filePath: string): {
  filePath: string;
  hasPasswordOperations: boolean;
  analysis?: ReturnType<typeof securityCheckPasswordHandling>;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Verificar si el archivo contiene operaciones con contraseñas
    const passwordPattern = /password|contraseña|clave|passwordDigest|hashPassword|comparePassword/i;
    const hasPasswordOperations = passwordPattern.test(content);
    
    if (!hasPasswordOperations) {
      return { filePath, hasPasswordOperations: false };
    }
    
    // Analizar el archivo
    const analysis = securityCheckPasswordHandling(content);
    
    return {
      filePath,
      hasPasswordOperations: true,
      analysis
    };
  } catch (error) {
    console.error(`Error analizando el archivo ${filePath}:`, error);
    return {
      filePath,
      hasPasswordOperations: false,
      analysis: {
        isSecure: false,
        issues: [`Error al analizar el archivo: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: ['Revisar manualmente el archivo']
      }
    };
  }
}

/**
 * Analiza todo el código para identificar problemas de seguridad con contraseñas
 */
export function analyzeCodebase(rootDir: string = process.cwd()): {
  totalFiles: number;
  filesWithPasswordOperations: number;
  secureFiles: number;
  insecureFiles: number;
  securityIssues: Array<{
    filePath: string;
    issues: string[];
    recommendations: string[];
  }>;
} {
  console.log('Buscando archivos de código...');
  const codeFiles = findCodeFiles(rootDir);
  console.log(`Encontrados ${codeFiles.length} archivos para analizar.`);
  
  let filesWithPasswordOperations = 0;
  let secureFiles = 0;
  let insecureFiles = 0;
  const securityIssues: Array<{
    filePath: string;
    issues: string[];
    recommendations: string[];
  }> = [];
  
  console.log('Analizando archivos...');
  for (const file of codeFiles) {
    const result = analyzeFile(file);
    
    if (result.hasPasswordOperations) {
      filesWithPasswordOperations++;
      
      if (result.analysis?.isSecure) {
        secureFiles++;
      } else {
        insecureFiles++;
        securityIssues.push({
          filePath: file,
          issues: result.analysis?.issues || ['Desconocido'],
          recommendations: result.analysis?.recommendations || ['Revisar manualmente']
        });
      }
    }
  }
  
  console.log('Análisis completado.');
  
  return {
    totalFiles: codeFiles.length,
    filesWithPasswordOperations,
    secureFiles,
    insecureFiles,
    securityIssues
  };
}

// Si se ejecuta este script directamente, analizar la base de código
if (require.main === module) {
  const results = analyzeCodebase();
  
  console.log('\n--- RESULTADOS DEL ANÁLISIS DE SEGURIDAD DE CONTRASEÑAS ---');
  console.log(`Total de archivos analizados: ${results.totalFiles}`);
  console.log(`Archivos con operaciones de contraseñas: ${results.filesWithPasswordOperations}`);
  console.log(`Archivos seguros: ${results.secureFiles}`);
  console.log(`Archivos con posibles problemas de seguridad: ${results.insecureFiles}\n`);
  
  if (results.insecureFiles > 0) {
    console.log('--- PROBLEMAS DETECTADOS ---');
    for (const issue of results.securityIssues) {
      console.log(`\nArchivo: ${issue.filePath}`);
      console.log('Problemas:');
      issue.issues.forEach((i, index) => console.log(`  ${index + 1}. ${i}`));
      console.log('Recomendaciones:');
      issue.recommendations.forEach((r, index) => console.log(`  ${index + 1}. ${r}`));
    }
  } else if (results.filesWithPasswordOperations > 0) {
    console.log('¡Genial! Todas las operaciones con contraseñas parecen estar utilizando métodos seguros.');
  } else {
    console.log('No se encontraron operaciones con contraseñas en el código analizado.');
  }
}
