// Test Data Setup Script for Face Authentication Testing
// This script can be used to pre-populate test data if needed

const testUsers = [
  {
    curp: "MARL850315HDFRTC01",
    nombre: "Marco Antonio",
    apellidoPaterno: "Rodriguez",
    apellidoMaterno: "Lopez",
    email: "marco.rodriguez@test.com",
    password: "TestPass123!", // Will be hashed during registration
    fechaNacimiento: "1985-03-15",
    sexo: "Masculino",
    municipio: "Ciudad de México",
    centroTrabajo: "Universidad Test",
    areaDepartamentoDireccion: "Administración",
    puesto: "Coordinador Administrativo",
    antiguedad: 5,
    nivelEducativo: "Licenciatura",
    turnoCentroTrabajo: "Matutino",
    telefono: "5555555555",
    role: "user",
    isActive: true,
    isVerified: false,
    hasFaceRegistered: false, // Will be set to true after face registration
    faceId: null, // Will be populated during face registration
    faceRegistrationDate: null, // Will be set during face registration
    eligibilityAnswers: {
      trabajadorInstituto: "yes",
      antiguedadMinima: "yes", 
      sinSancionesActivas: "yes",
      disponibilidadTiempo: "yes",
      compromisoEtico: "yes"
    },
    isEligibleForVoting: true,
    registrationDate: new Date(),
    lastLogin: null
  },
  {
    curp: "SAGL900822MDFRNN02",
    nombre: "Sofia Alejandra",
    apellidoPaterno: "Garcia",
    apellidoMaterno: "Luna",
    email: "sofia.garcia@test.com",
    password: "TestPass456!",
    fechaNacimiento: "1990-08-22",
    sexo: "Femenino",
    municipio: "Ciudad de México",
    centroTrabajo: "Universidad Test",
    areaDepartamentoDireccion: "Académico",
    puesto: "Profesora Investigadora",
    antiguedad: 5,
    nivelEducativo: "Maestría",
    turnoCentroTrabajo: "Matutino",
    telefono: "5555555556",
    role: "user",
    isActive: true,
    isVerified: false,
    hasFaceRegistered: false,
    faceId: null,
    faceRegistrationDate: null,
    eligibilityAnswers: {
      trabajadorInstituto: "yes",
      antiguedadMinima: "yes",
      sinSancionesActivas: "yes", 
      disponibilidadTiempo: "yes",
      compromisoEtico: "yes"
    },
    isEligibleForVoting: true,
    registrationDate: new Date(),
    lastLogin: null
  },
  {
    curp: "JUCR881205HDFRLS03", 
    nombre: "Juan Carlos",
    apellidoPaterno: "Cruz",
    apellidoMaterno: "Ramirez",
    email: "juan.cruz@test.com",
    password: "TestPass789!",
    fechaNacimiento: "1988-12-05",
    sexo: "Masculino",
    municipio: "Ciudad de México",
    centroTrabajo: "Universidad Test",
    areaDepartamentoDireccion: "Soporte Técnico",
    puesto: "Técnico en Sistemas",
    antiguedad: 5,
    nivelEducativo: "Licenciatura",
    turnoCentroTrabajo: "Matutino",
    telefono: "5555555557",
    role: "user",
    isActive: true,
    isVerified: false,
    hasFaceRegistered: false,
    faceId: null,
    faceRegistrationDate: null,
    eligibilityAnswers: {
      trabajadorInstituto: "yes",
      antiguedadMinima: "yes",
      sinSancionesActivas: "yes",
      disponibilidadTiempo: "yes", 
      compromisoEtico: "yes"
    },
    isEligibleForVoting: true,
    registrationDate: new Date(),
    lastLogin: null
  },
  {
    curp: "MELH920718MDFRNL04",
    nombre: "Maria Elena", 
    apellidoPaterno: "Lopez",
    apellidoMaterno: "Hernandez",
    email: "maria.lopez@test.com",
    password: "TestPass321!",
    fechaNacimiento: "1992-07-18",
    sexo: "Femenino",
    municipio: "Ciudad de México",
    centroTrabajo: "Universidad Test",
    areaDepartamentoDireccion: "Coordinación Académica",
    puesto: "Coordinadora Académica",
    antiguedad: 5,
    nivelEducativo: "Maestría",
    turnoCentroTrabajo: "Matutino",
    telefono: "5555555558",
    role: "user",
    isActive: true,
    isVerified: false,
    hasFaceRegistered: false,
    faceId: null,
    faceRegistrationDate: null,
    eligibilityAnswers: {
      trabajadorInstituto: "yes",
      antiguedadMinima: "yes",
      sinSancionesActivas: "yes",
      disponibilidadTiempo: "yes",
      compromisoEtico: "yes"
    },
    isEligibleForVoting: true,
    registrationDate: new Date(),
    lastLogin: null
  }
];

console.log('Test Users Data:');
console.log('================');
testUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.nombre} ${user.apellidoPaterno}`);
  console.log(`   CURP: ${user.curp}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log(`   Position: ${user.puesto}`);
  console.log(`   Department: ${user.areaDepartamentoDireccion}`);
  console.log('');
});

// Export for potential database seeding
export { testUsers };

// Instructions
console.log('TESTING INSTRUCTIONS:');
console.log('=====================');
console.log('1. Use any of the above credentials to register a new account');
console.log('2. Fill in all required registration fields');
console.log('3. When you reach the Face Registration step, use your actual face');
console.log('4. Complete the registration process');
console.log('5. Test login with CURP + Password');
console.log('6. Test login with Face Authentication');
console.log('7. You can register multiple accounts with the same face for testing');
console.log('');
console.log('Note: The same physical person can register multiple test accounts');
console.log('      Each account will have its own face ID in the Azure Face API');
