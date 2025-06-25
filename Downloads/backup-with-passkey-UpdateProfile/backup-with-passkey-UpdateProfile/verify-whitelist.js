// Script to verify test CURPs are in the whitelist
async function checkWhitelist() {
  try {
    const response = await fetch('http://localhost:3002/api/db/read?collectionName=whitelist&query={}');
    const whitelistData = await response.json();
    
    console.log('📋 Current Whitelist:');
    console.log('====================');
    
    const testCurps = [
      'MARL850315HDFRTC01',
      'SAGL900822MDFRNN02', 
      'JUCR881205HDFRLS03',
      'MELH920718MDFRNL04'
    ];
    
    whitelistData.forEach((entry, index) => {
      const isTestCurp = testCurps.includes(entry.curp);
      const emoji = isTestCurp ? '🧪' : '👤';
      console.log(`${emoji} ${entry.curp} ${isTestCurp ? '(TEST CURP)' : ''}`);
    });
    
    console.log(`\n📊 Total whitelist entries: ${whitelistData.length}`);
    
    const testCurpsInWhitelist = whitelistData.filter(entry => 
      testCurps.includes(entry.curp)
    ).length;
    
    console.log(`🧪 Test CURPs in whitelist: ${testCurpsInWhitelist}/${testCurps.length}`);
    
    if (testCurpsInWhitelist === testCurps.length) {
      console.log('\n✅ All test CURPs are properly whitelisted!');
      console.log('🎭 You can now proceed with face authentication testing.');
    } else {
      console.log('\n⚠️  Some test CURPs are missing from whitelist.');
    }
    
  } catch (error) {
    console.error('❌ Error checking whitelist:', error);
  }
}

checkWhitelist();
