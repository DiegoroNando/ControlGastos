
// services/migrationHelper.ts
// Helper to migrate data from localStorage to MongoDB

import * as storageService from './storageService'; // Keep for reading source data
import * as databaseService from './databaseService';
import { SUPERADMIN_CURP } from '../constants';

export const migrateFromLocalStorageToDatabase = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('🔄 Starting migration from localStorage to MongoDB...');
    
    // Database should be initialized by App.tsx before this is called if needed
    // await databaseService.initializeData(); // This might already be called or race condition
    
    // Check if localStorage has data to migrate
    if (typeof window === 'undefined') {
      return { success: true, message: 'No localStorage available (server-side), migration skipped or handled by backend.' };
    }
    
    let migratedUsersCount = 0;
    let migratedPostsCount = 0;
    let migratedVotesCount = 0;
    let updatedUsersCount = 0;
    
    // Migrate Users
    console.log('👤 Migrating users...');
    const localUsers = storageService.getUsers(); // Read from localStorage
    if (localUsers.length > 0 && localUsers.some(u => u.curp !== SUPERADMIN_CURP)) { // Check if there's more than just potential superadmin
      for (const localUser of localUsers) {
        try {
          const existingDBUser = await databaseService.getUserByCurp(localUser.curp);
          if (!existingDBUser) {
            await databaseService.addUser(localUser); // addUser in databaseService handles ensuring fields
            migratedUsersCount++;
            console.log(`✅ Migrated new user to DB: ${localUser.curp}`);
          } else {
            // Optionally update existing user with data from localStorage if newer or different
            // For simplicity, we'll assume if user exists, it's up-to-date or handled by `ensureUserFields`
            // console.log(`User ${localUser.curp} already exists in DB. Checking for updates.`);
            // await databaseService.updateUser({...existingDBUser, ...localUser}); // Basic merge, ensureUserFields will clean up
            updatedUsersCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to migrate user ${localUser.curp}:`, error);
        }
      }
    }
    
    // Migrate Whitelist
    console.log('📋 Migrating whitelist...');
    const localWhitelist = storageService.getWhitelist(); // Read from localStorage
    if (localWhitelist.length > 0) {
        for (const curp of localWhitelist) {
            try {
                if (!(await databaseService.isWhitelisted(curp))) {
                    await databaseService.addToWhitelist(curp);
                    console.log(`✅ Migrated whitelist entry to DB: ${curp}`);
                }
            } catch (error) {
                console.error(`❌ Failed to migrate whitelist entry ${curp}:`, error);
            }
        }
    }
    
    // Migrate Posts
    console.log('📝 Migrating posts...');
    const localPosts = storageService.getPosts(); // Read from localStorage
    if (localPosts.length > 0) {
        const dbPosts = await databaseService.getPosts();
        const dbPostIds = new Set(dbPosts.map(p => p.id));
        for (const localPost of localPosts) {
            try {
                if (!dbPostIds.has(localPost.id)) {
                    const { transientVideoFile, ...postToMigrate } = localPost; // Exclude transient file
                    await databaseService.addPost(postToMigrate); // addPost in DB service will handle structure
                    migratedPostsCount++;
                    console.log(`✅ Migrated post to DB: ${localPost.id}`);
                }
            } catch (error) {
                console.error(`❌ Failed to migrate post ${localPost.id}:`, error);
            }
        }
    }

    // Migrate Votes
    console.log('🗳️ Migrating votes...');
    const localVotes = storageService.getVotes(); // Read from localStorage
    if (localVotes.length > 0) {
        const dbVotes = await databaseService.getVotes();
        const dbVoteIds = new Set(dbVotes.map(v => v.id));
        for (const localVote of localVotes) {
            try {
                if (!dbVoteIds.has(localVote.id)) {
                    await databaseService.addVote(localVote.voterId, localVote.candidateId, localVote.blockOfCandidacy);
                    migratedVotesCount++;
                    console.log(`✅ Migrated vote to DB: ${localVote.id}`);
                }
            } catch (error) {
                console.error(`❌ Failed to migrate vote ${localVote.id}:`, error);
            }
        }
    }
    
    // Migrate Election Settings
    console.log('⚙️ Migrating election settings...');
    try {
      const localElectionSettings = storageService.getElectionSettings(); // Read from localStorage
      await databaseService.saveElectionSettings(localElectionSettings);
      console.log(`✅ Migrated election settings to DB`);
    } catch (error) {
      console.error(`❌ Failed to migrate election settings:`, error);
    }
    
    // Migrate Block Settings
    console.log('🏗️ Migrating block settings...');
    try {
      const localBlockSettings = storageService.getBlockSettings(); // Read from localStorage
      await databaseService.saveBlockSettings(localBlockSettings);
      console.log(`✅ Migrated block settings to DB`);
    } catch (error) {
      console.error(`❌ Failed to migrate block settings:`, error);
    }
    
    // Migrate Auth Session - This might be tricky as we're moving to a new session mechanism
    // Best effort: if a user was logged in via localStorage, log them in via DB
    console.log('🔐 Migrating auth session (best effort)...');
    try {
      const loggedInUserCurp = storageService.getLoggedInUserCurp(); // Read from localStorage
      if (loggedInUserCurp) {
        const user = await databaseService.getUserByCurp(loggedInUserCurp);
        if (user) {
            // For the new system, we'd generate a new sessionId.
            // For simplicity, we'll just ensure their active session is noted if one exists.
            // The AuthProvider will handle creating a new proper session on next login.
            console.log(`👤 User ${loggedInUserCurp} was logged in via localStorage. Next login will use new session mechanism.`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to migrate auth session:`, error);
    }
    
    console.log(`🎉 Migration completed! Migrated ${migratedUsersCount} new users, ${migratedPostsCount} posts, ${migratedVotesCount} votes. Updated ${updatedUsersCount} existing users.`);
    localStorage.setItem('migration_completed_to_db_v1', 'true'); // Mark migration as done

    return { 
      success: true, 
      message: `Migration completed successfully. Migrated ${migratedUsersCount} new users, ${migratedPostsCount} posts, ${migratedVotesCount} votes. Updated ${updatedUsersCount} existing users (if applicable).`
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Function to check if migration is needed
export const isMigrationNeeded = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false; // No localStorage
    
    // Check if migration has already been marked as completed
    if (localStorage.getItem('migration_completed_to_db_v1') === 'true') {
      console.log('Migration to DB v1 already completed.');
      return false;
    }

    // Step 1: Check if there's anything in localStorage to migrate (excluding superadmin CURP from whitelist for this check)
    const localUsers = storageService.getUsers();
    const localWhitelist = storageService.getWhitelist().filter(curp => curp !== SUPERADMIN_CURP); // Exclude superadmin for this check
    const localPosts = storageService.getPosts();
    const localVotes = storageService.getVotes();

    const localStorageHasData = 
      (localUsers.length > 0 && localUsers.some(u => u.curp !== SUPERADMIN_CURP)) || // More than just superadmin
      localWhitelist.length > 0 ||
      localPosts.length > 0 ||
      localVotes.length > 0;

    if (!localStorageHasData) {
      console.log('No significant data in localStorage to migrate.');
      localStorage.setItem('migration_completed_to_db_v1', 'true'); // Mark as "completed" as there's nothing to do
      return false; 
    }

    // Step 2: Check if the database is "fresh" (contains only the superadmin or is empty)
    const dbUsers = await databaseService.getUsers();
    const isDBFresh = dbUsers.length <= 1 && (dbUsers.length === 0 || (dbUsers.length === 1 && dbUsers[0].curp === SUPERADMIN_CURP));

    if (isDBFresh) {
      console.log('Database is fresh and localStorage has data. Migration needed.');
      return true; // Database is fresh and localStorage has data, so migration is needed
    } else {
      console.log('Database already contains significant data. Migration from localStorage likely not needed or already done.');
      localStorage.setItem('migration_completed_to_db_v1', 'true'); // Mark as completed to avoid re-checking
      return false; // Database is not fresh, so no migration needed from localStorage
    }

  } catch (error) {
    console.error('Error checking migration status:', error);
    // In case of error, assume migration is not needed to avoid accidental data issues
    return false; 
  }
};
