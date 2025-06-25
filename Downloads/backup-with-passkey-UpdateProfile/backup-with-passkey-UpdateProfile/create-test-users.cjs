// Script to create base user records for test CURPs
const fetch = require('node-fetch');

const testUsers = [
  {
    curp: "MARL850315HDFRTC01",
    nombre: "Marco Antonio",
    apellidoPaterno: "Rodriguez",
    apellidoMaterno: "Lopez",
    email: "marco.rodriguez@test.com",
    fechaNacimiento: "1985-03-15", // Extracted from CURP
    sexo: "HOMBRE",
    educationalLevel: "LICENCIATURA",
    role: "USER",
    assignedBlock: "BLOQUE_DIRECTIVO",
    areaDepartamentoDireccion: "AREA_ADMINISTRACION",
    puesto: "Coordinador Administrativo",
    isRegisteredAsCandidate: false,
    votesCast: {},
    peerNominations: [],
    hasPendingPeerNominationDecision: false,
    nominationsMade: {},
    hasLoggedInOnce: false,
    isEligibleForVoting: true
  },
  {
    curp: "SAGL900822MDFRNN02",
    nombre: "Sofia Alejandra",
    apellidoPaterno: "Garcia",
    apellidoMaterno: "Luna",
    email: "sofia.garcia@test.com",
    fechaNacimiento: "1990-08-22",
    sexo: "MUJER",
    educationalLevel: "MAESTRIA",
    role: "USER",
    assignedBlock: "BLOQUE_ACADEMICO",
    areaDepartamentoDireccion: "AREA_ACADEMICA",
    puesto: "Profesora Investigadora",
    isRegisteredAsCandidate: false,
    votesCast: {},
    peerNominations: [],
    hasPendingPeerNominationDecision: false,
    nominationsMade: {},
    hasLoggedInOnce: false,
    isEligibleForVoting: true
  },
  {
    curp: "JUCR881205HDFRLS03",
    nombre: "Juan Carlos",
    apellidoPaterno: "Cruz",
    apellidoMaterno: "Ramirez",
    email: "juan.cruz@test.com",
    fechaNacimiento: "1988-12-05",
    sexo: "HOMBRE",
    educationalLevel: "LICENCIATURA",
    role: "USER",
    assignedBlock: "BLOQUE_TECNICO_ADMINISTRATIVO",
    areaDepartamentoDireccion: "AREA_TECNOLOGIA",
    puesto: "Analista de Sistemas",
    isRegisteredAsCandidate: false,
    votesCast: {},
    peerNominations: [],
    hasPendingPeerNominationDecision: false,
    nominationsMade: {},
    hasLoggedInOnce: false,
    isEligibleForVoting: true
  },
  {
    curp: "MELH920718MDFRNL04",
    nombre: "Maria Elena",
    apellidoPaterno: "Lopez",
    apellidoMaterno: "Hernandez",
    email: "maria.lopez@test.com",
    fechaNacimiento: "1992-07-18",
    sexo: "MUJER",
    educationalLevel: "LICENCIATURA",
    role: "USER",
    assignedBlock: "BLOQUE_COORDINACION",
    areaDepartamentoDireccion: "AREA_COORDINACION",
    puesto: "Coordinadora de Proyectos",
    isRegisteredAsCandidate: false,
    votesCast: {},
    peerNominations: [],
    hasPendingPeerNominationDecision: false,
    nominationsMade: {},
    hasLoggedInOnce: false,
    isEligibleForVoting: true
  }
];

async function createUserRecord(userData) {
  try {
    // Add ID field (same as CURP)
    const userWithId = {
      id: userData.curp,
      ...userData
    };

    const response = await fetch('http://localhost:3002/api/db/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionName: 'users',
        data: userWithId
      })
    });

    const result = await response.json();
    console.log(`${result.success ? '✅' : '❌'} ${userData.curp} (${userData.nombre} ${userData.apellidoPaterno}): ${result.message}`);
    return result.success;
  } catch (error) {
    console.log(`❌ Error creating user ${userData.curp}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Creating base user records for test CURPs...');
  console.log('=====================================');

  for (const userData of testUsers) {
    await createUserRecord(userData);
  }

  console.log('\n✅ All test user records processed!');
  console.log('📋 Users can now complete registration with:');
  console.log('CURP: MARL850315HDFRTC01 | Password: TestPass123!');
  console.log('CURP: SAGL900822MDFRNN02 | Password: TestPass456!');
  console.log('CURP: JUCR881205HDFRLS03 | Password: TestPass789!');
  console.log('CURP: MELH920718MDFRNL04 | Password: TestPass321!');
  console.log('\n🎯 Ready to test registration at: http://localhost:5173/');
}

main().catch(console.error);
