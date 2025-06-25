/**
 * Utility for migrating all plain text passwords to bcrypt hashed passwords
 * This can be run as a one-time operation to ensure all users have secure passwords
 */

import { getUsers, updateUser } from '../services/databaseService';
import { hashPassword, isPasswordHashed } from '../services/passwordService';

/**
 * Migrates all plain text passwords in the database to bcrypt hashed passwords
 * @returns Object with statistics about the migration
 */
export const migrateAllPlainPasswords = async (): Promise<{
  totalUsers: number;
  usersWithPlainPasswords: number;
  migratedUsers: number;
  alreadyHashedUsers: number;
  emptyPasswordUsers: number;
  errors: Array<{ curp: string; error: string }>;
}> => {
  const stats = {
    totalUsers: 0,
    usersWithPlainPasswords: 0,
    migratedUsers: 0,
    alreadyHashedUsers: 0,
    emptyPasswordUsers: 0,
    errors: [] as Array<{ curp: string; error: string }>
  };

  try {
    // Get all users from the database
    const users = await getUsers();
    stats.totalUsers = users.length;
    
    console.log(`Beginning password migration for ${users.length} users...`);

    // Process each user
    for (const user of users) {
      try {
        // Skip users with empty passwords
        if (!user.passwordDigest) {
          stats.emptyPasswordUsers++;
          continue;
        }
        
        // Skip users that already have hashed passwords
        if (isPasswordHashed(user.passwordDigest)) {
          stats.alreadyHashedUsers++;
          continue;
        }
        
        // Found a user with plain text password
        stats.usersWithPlainPasswords++;
        
        // Hash the password with bcrypt
        const hashedPassword = await hashPassword(user.passwordDigest);
        
        // Update the user with the hashed password
        const updatedUser = {
          ...user,
          passwordDigest: hashedPassword
        };
        
        await updateUser(updatedUser);
        stats.migratedUsers++;
        console.log(`Migrated password for user with CURP: ${user.curp}`);
      } catch (error) {
        console.error(`Error migrating password for user with CURP: ${user.curp}`, error);
        stats.errors.push({
          curp: user.curp,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    console.log('Password migration completed:', stats);
    return stats;
  } catch (error) {
    console.error('Error during password migration:', error);
    throw error;
  }
};

/**
 * Checks the current status of password security in the system
 * @returns Stats about password security
 */
export const checkPasswordSecurityStatus = async (): Promise<{
  totalUsers: number;
  securePasswordUsers: number;
  plainPasswordUsers: number;
  emptyPasswordUsers: number;
  securityPercentage: number;
}> => {
  let secure = 0;
  let plain = 0;
  let empty = 0;
  
  const users = await getUsers();
  
  for (const user of users) {
    if (!user.passwordDigest) {
      empty++;
    } else if (isPasswordHashed(user.passwordDigest)) {
      secure++;
    } else {
      plain++;
    }
  }
  
  const total = users.length;
  const securityPercentage = total > 0 ? (secure / total) * 100 : 0;
  
  return {
    totalUsers: total,
    securePasswordUsers: secure,
    plainPasswordUsers: plain,
    emptyPasswordUsers: empty,
    securityPercentage: Math.round(securityPercentage * 100) / 100 // Round to 2 decimal places
  };
};
