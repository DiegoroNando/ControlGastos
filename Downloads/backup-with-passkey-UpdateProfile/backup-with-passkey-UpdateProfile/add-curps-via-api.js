// Simple script to add test CURPs to whitelist via API calls
const testCurps = [
  'MARL850315HDFRTC01', // Marco Antonio Rodriguez Lopez
  'SAGL900822MDFRNN02', // Sofia Alejandra Garcia Luna  
  'JUCR881205HDFRLS03', // Juan Carlos Cruz Ramirez
  'MELH920718MDFRNL04'  // Maria Elena Lopez Hernandez
];

async function addCurpToWhitelist(curp) {
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
      console.log(`✅ ${curp} added to whitelist successfully`);
      return true;
    } else {
      const error = await response.text();
      console.log(`⚠️  ${curp} might already exist or error: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error adding ${curp}:`, error.message);
    return false;
  }
}

async function addAllTestCurps() {
  console.log('🔄 Adding test CURPs to whitelist...');
  console.log('=====================================');
  
  for (const curp of testCurps) {
    console.log(`Adding ${curp}...`);
    await addCurpToWhitelist(curp);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Process completed!');
  console.log('\nYou can now register with these credentials:');
  console.log('- CURP: MARL850315HDFRTC01 / Password: TestPass123!');
  console.log('- CURP: SAGL900822MDFRNN02 / Password: TestPass456!');
  console.log('- CURP: JUCR881205HDFRLS03 / Password: TestPass789!');
  console.log('- CURP: MELH920718MDFRNL04 / Password: TestPass321!');
}

// Run the script
addAllTestCurps().catch(console.error);
