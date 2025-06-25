// Script to add test CURPs to the whitelist
const testCURPs = [
  "MARL850315HDFRTC01", // Marco Antonio Rodriguez Lopez
  "SAGL900822MDFRNN02", // Sofia Alejandra Garcia Luna  
  "JUCR881205HDFRLS03", // Juan Carlos Cruz Ramirez
  "MELH920718MDFRNL04"  // Maria Elena Lopez Hernandez
];

async function addCURPToWhitelist(curp) {
  try {
    const response = await fetch('http://localhost:3002/api/whitelist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ curp })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Added ${curp} to whitelist:`, result);
      return true;
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

async function addAllTestCURPs() {
  console.log('🔧 Adding test CURPs to whitelist...');
  console.log('=====================================');
  
  for (const curp of testCURPs) {
    await addCURPToWhitelist(curp);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('✅ All test CURPs processed!');
  console.log('');
  console.log('📋 Test Credentials Ready:');
  console.log('CURP: MARL850315HDFRTC01 | Password: TestPass123!');
  console.log('CURP: SAGL900822MDFRNN02 | Password: TestPass456!');
  console.log('CURP: JUCR881205HDFRLS03 | Password: TestPass789!');
  console.log('CURP: MELH920718MDFRNL04 | Password: TestPass321!');
  console.log('');
  console.log('🎯 Ready to test registration at: http://localhost:5173/');
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - use dynamic import for fetch
  (async () => {
    try {
      const { default: fetch } = await import('node-fetch');
      global.fetch = fetch;
      await addAllTestCURPs();
    } catch (error) {
      console.log('Installing node-fetch...');
      console.log('Run: npm install node-fetch');
      console.log('Then run this script again');
    }
  })();
} else {
  // Browser environment
  addAllTestCURPs();
}
