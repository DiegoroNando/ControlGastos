// Script to add test CURPs to the whitelist for face authentication testing
import { addToWhitelist } from './src/services/databaseService.js';

const testCurps = [
  'MARL850315HDFRTC01', // Marco Antonio Rodriguez Lopez
  'SAGL900822MDFRNN02', // Sofia Alejandra Garcia Luna  
  'JUCR881205HDFRLS03', // Juan Carlos Cruz Ramirez
  'MELH920718MDFRNL04'  // Maria Elena Lopez Hernandez
];

async function addTestCurpsToWhitelist() {
  console.log('🔄 Adding test CURPs to whitelist...');
  console.log('=====================================');
  
  try {
    for (const curp of testCurps) {
      console.log(`Adding ${curp} to whitelist...`);
      await addToWhitelist(curp);
      console.log(`✅ ${curp} added successfully`);
    }
    
    console.log('\n🎉 All test CURPs added to whitelist successfully!');
    console.log('\nYou can now register with these credentials:');
    console.log('- MARL850315HDFRTC01 / TestPass123!');
    console.log('- SAGL900822MDFRNN02 / TestPass456!');
    console.log('- JUCR881205HDFRLS03 / TestPass789!');
    console.log('- MELH920718MDFRNL04 / TestPass321!');
    
  } catch (error) {
    console.error('❌ Error adding CURPs to whitelist:', error);
  }
}

// Run the script
addTestCurpsToWhitelist();
