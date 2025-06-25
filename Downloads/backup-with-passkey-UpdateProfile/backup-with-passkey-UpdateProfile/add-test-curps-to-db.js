// Script to add test CURPs directly to the database
const testCURPs = [
  "MARL850315HDFRTC01", // Marco Antonio Rodriguez Lopez
  "SAGL900822MDFRNN02", // Sofia Alejandra Garcia Luna  
  "JUCR881205HDFRLS03", // Juan Carlos Cruz Ramirez
  "MELH920718MDFRNL04"  // Maria Elena Lopez Hernandez
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

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Added ${curp} to whitelist database:`, result.success ? 'SUCCESS' : result.message);
      return result.success;
    } else {
      const error = await response.text();
      console.log(`❌ Failed to add ${curp}:`, error);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error adding ${curp}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Adding test CURPs directly to database...');
  console.log('=====================================');

  for (const curp of testCURPs) {
    await addCURPToDatabase(curp);
  }

  console.log('✅ All test CURPs processed!');
  console.log('📋 Test Credentials Ready:');
  console.log('CURP: MARL850315HDFRTC01 | Password: TestPass123!');
  console.log('CURP: SAGL900822MDFRNN02 | Password: TestPass456!');
  console.log('CURP: JUCR881205HDFRLS03 | Password: TestPass789!');
  console.log('CURP: MELH920718MDFRNL04 | Password: TestPass321!');
  console.log('🎯 Ready to test registration at: http://localhost:5173/');
}

// Check if node-fetch is available
try {
  await import('node-fetch');
  // Use node-fetch for Node.js environments
  const fetch = (await import('node-fetch')).default;
  global.fetch = fetch;
} catch (e) {
  // If node-fetch is not available, assume fetch is available globally
  if (typeof fetch === 'undefined') {
    console.log('❌ fetch is not available. Please install node-fetch or use a Node.js version with built-in fetch.');
    process.exit(1);
  }
}

main().catch(console.error);
