// seed-test-users.js
// Script to seed 10 test users and whitelist them for registration

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Generate mock CURP - 18 characters
function generateMockCurp() {
  // First 4 letters: First letter of paternal surname, first vowel of paternal surname,
  // first letter of maternal surname, first letter of first name
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstFour = Array(4).fill().map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  
  // Next 6 digits: YY MM DD (year, month, day of birth)
  const year = Math.floor(Math.random() * 30) + 70; // Years between 1970 and 1999
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  // Next 1 letter: Sex (H for male or M for female)
  const sex = Math.random() > 0.5 ? 'H' : 'M';
  
  // Next 2 letters: State code
  const states = ['DF', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS'];
  const state = states[Math.floor(Math.random() * states.length)];
  
  // Last 3 characters: Consonants + verification digit
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const lastThree = Array(3).fill().map(() => consonants.charAt(Math.floor(Math.random() * consonants.length))).join('');
  
  return `${firstFour}${year}${month}${day}${sex}${state}${lastThree}`;
}

// Function to generate a test user
function generateTestUser(index) {
  const curp = generateMockCurp();
  const nombre = `Test${index}`;
  const apellidoPaterno = `User${index}`;
  const apellidoMaterno = 'Demo';
  const email = `testuser${index}@example.com`;
  
  return {
    curp,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    email,
    passwordDigest: bcrypt.hashSync('TestPassword123!', 10),
    tipo: 'Votante',
    isWhitelisted: true,
    whitelistedAt: new Date(),
    hasPasskeyRegistered: false,
    hasFaceRegistered: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function seedTestUsers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    console.log(`Connecting to MongoDB at ${uri}`);
    
    const client = await MongoClient.connect(uri);
    const db = client.db(process.env.DB_NAME || 'sistema-votaciones');
    
    console.log('Connected to MongoDB');
    
    // Collection for users
    const usersCollection = db.collection('users');
    
    // Collection for whitelisted users
    const whitelistCollection = db.collection('whitelist');
    
    // Generate 10 test users
    const testUsers = [];
    const whitelistEntries = [];
    
    for (let i = 1; i <= 10; i++) {
      const user = generateTestUser(i);
      testUsers.push(user);
      
      // Also create whitelist entry
      whitelistEntries.push({
        curp: user.curp,
        email: user.email,
        whitelistedAt: new Date(),
        registeredAt: null,
        isRegistered: false
      });
    }
    
    // Insert users
    const userResult = await usersCollection.insertMany(testUsers);
    console.log(`${userResult.insertedCount} test users inserted`);
    
    // Insert whitelist entries
    const whitelistResult = await whitelistCollection.insertMany(whitelistEntries);
    console.log(`${whitelistResult.insertedCount} whitelist entries inserted`);
    
    // Print out the created users for reference
    console.log('\nCreated Test Users:');
    console.log('===================');
    
    testUsers.forEach(user => {
      console.log(`User: ${user.nombre} ${user.apellidoPaterno}`);
      console.log(`CURP: ${user.curp}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: TestPassword123!`);
      console.log('-------------------');
    });
    
    // Print curl commands for reference
    console.log('\nCURL Commands for Adding Users:');
    console.log('=============================');
    
    testUsers.forEach(user => {
      console.log(`# Add user ${user.nombre} ${user.apellidoPaterno}`);
      const curlCommand = `curl -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d '{
  "curp": "${user.curp}",
  "nombre": "${user.nombre}",
  "apellidoPaterno": "${user.apellidoPaterno}",
  "apellidoMaterno": "${user.apellidoMaterno}",
  "email": "${user.email}",
  "password": "TestPassword123!",
  "tipo": "${user.tipo}"
}'`;
      console.log(curlCommand);
      console.log('');
    });
    
    console.log('\nCURL Commands for Whitelisting Users:');
    console.log('==================================');
    
    testUsers.forEach(user => {
      console.log(`# Whitelist user ${user.nombre} ${user.apellidoPaterno}`);
      const curlCommand = `curl -X POST http://localhost:3001/api/whitelist -H "Content-Type: application/json" -d '{
  "curp": "${user.curp}",
  "email": "${user.email}"
}'`;
      console.log(curlCommand);
      console.log('');
    });

    
    client.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding test users:', error);
  }
}

// Run the seeding function
seedTestUsers().catch(console.error);
