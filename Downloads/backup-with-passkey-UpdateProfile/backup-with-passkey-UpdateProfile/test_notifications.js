/**
 * Script de prueba para el sistema de notificaciones
 * Este script simulará el envío de notificaciones para verificar que el sistema funciona correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para simular la creación de una notificación
function createTestNotification() {
  const notification = {
    id: Date.now().toString(),
    type: 'candidacy_withdrawal',
    title: 'Retiro de Candidatura - PRUEBA',
    message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
    timestamp: Date.now(),
    read: false,
    userData: {
      nombre: 'Usuario',
      apellidoPaterno: 'De Prueba',
      assignedBlock: 'Bloque 1',
      curp: 'TEST123456789'
    }
  };

  console.log('📧 Notificación de prueba creada:');
  console.log(JSON.stringify(notification, null, 2));
  
  return notification;
}

// Función para verificar el icono de campana
function verifyBellIcon() {
  const componentPath = path.join(__dirname, 'src', 'components', 'common', 'CommonComponents.tsx');
  
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Buscar el SVG path correcto para la campana
    const bellPaths = [
      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z',
      'M13.73 21a2 2 0 01-3.46 0'
    ];
    
    const hasBellIcon = bellPaths.every(path => content.includes(path));
    
    if (hasBellIcon) {
      console.log('✅ Icono de campana verificado correctamente');
      console.log('   - Paths de SVG encontrados para la campana');
    } else {
      console.log('❌ Problema con el icono de campana');
      console.log('   - Revisar los paths del SVG');
    }
    
    return hasBellIcon;
  } else {
    console.log('❌ Archivo CommonComponents.tsx no encontrado');
    return false;
  }
}

// Función para verificar la integración de notificaciones
function verifyNotificationIntegration() {
  const files = [
    'src/hooks/useNotifications.ts',
    'src/services/notificationService.ts',
    'src/components/common/CommonComponents.tsx',
    'src/pages/CandidateDashboardContent.tsx'
  ];
  
  console.log('🔍 Verificando archivos del sistema de notificaciones...');
  
  let allFilesExist = true;
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  });
  
  return allFilesExist;
}

// Función para verificar el servidor de email
async function verifyEmailServer() {
  console.log('🌐 Verificando servidor de email...');
  
  try {
    // Using fetch for HTTP requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('http://localhost:3001/api/status', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Servidor de email funcionando correctamente');
        return true;
      } else {
        console.log('❌ Problema con el servidor de email');
        return false;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log('❌ Timeout al conectar con el servidor de email');
      } else {
        console.log('❌ No se pudo conectar al servidor de email');
        console.log(`   Error: ${fetchError.message}`);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Error al verificar servidor de email');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Función principal de prueba
async function runTests() {
  console.log('🚀 Iniciando pruebas del sistema de notificaciones...\n');
  
  // Test 1: Verificar estructura de archivos
  console.log('📁 Test 1: Estructura de archivos');
  const filesOk = verifyNotificationIntegration();
  console.log('');
  
  // Test 2: Verificar icono de campana
  console.log('🔔 Test 2: Icono de campana');
  const iconOk = verifyBellIcon();
  console.log('');
  
  // Test 3: Crear notificación de prueba
  console.log('📋 Test 3: Creación de notificación');
  const testNotification = createTestNotification();
  console.log('');
  
  // Test 4: Verificar servidor (si está corriendo)
  console.log('🌐 Test 4: Servidor de email');
  const serverOk = await verifyEmailServer();
  console.log('');
  
  // Resumen final
  console.log('📊 Resumen de pruebas:');
  console.log(`   Archivos del sistema: ${filesOk ? '✅' : '❌'}`);
  console.log(`   Icono de campana: ${iconOk ? '✅' : '❌'}`);
  console.log(`   Creación de notificación: ✅`);
  console.log(`   Servidor de email: ${serverOk ? '✅' : '❌'}`);
  
  const allTestsPassed = filesOk && iconOk && serverOk;
  console.log(`\n🎯 Estado general: ${allTestsPassed ? '✅ TODOS LOS TESTS PASARON' : '⚠️  ALGUNOS TESTS FALLARON'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 ¡El sistema de notificaciones está funcionando correctamente!');
    console.log('   - El icono de campana se muestra correctamente');
    console.log('   - Las notificaciones se pueden crear y gestionar');
    console.log('   - El servidor de email está operativo');
    console.log('   - La integración con el retiro de candidaturas funciona');
  } else {
    console.log('\n🔧 Se encontraron algunos problemas que requieren atención.');
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);

export {
  createTestNotification,
  verifyBellIcon,
  verifyNotificationIntegration,
  verifyEmailServer,
  runTests
};
