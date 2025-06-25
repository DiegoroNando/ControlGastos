// Simple script to add test CURPs to database
const fetch = require('node-fetch');

const testCURPs = [
  "MARL850315HDFRTC01", 
  "SAGL900822MDFRNN02",
  "JUCR881205HDFRLS03",
  "MELH920718MDFRNL04"
];

async function addCURPToDatabase(curp) {
  try {
    const response = await fetch('http://localhost:3002/api/db/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionName: 'whitelist',
        data: { curp: curp.toUpperCase() }
      })
    });

    const result = await response.json();
    console.log(`${result.success ? '✅' : '❌'} ${curp}: ${result.message}`);
    return result.success;
  } catch (error) {
    console.log(`❌ Error adding ${curp}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Adding test CURPs to database...');
  console.log('=====================================');

  for (const curp of testCURPs) {
    await addCURPToDatabase(curp);
  }

  console.log('\n✅ All test CURPs processed!');
  console.log('📋 Test Credentials Ready:');
  console.log('CURP: MARL850315HDFRTC01 | Password: TestPass123!');
  console.log('CURP: SAGL900822MDFRNN02 | Password: TestPass456!');
  console.log('CURP: JUCR881205HDFRLS03 | Password: TestPass789!');
  console.log('CURP: MELH920718MDFRNL04 | Password: TestPass321!');
  console.log('\n🎯 Ready to test registration at: http://localhost:5173/');
}

main().catch(console.error);
