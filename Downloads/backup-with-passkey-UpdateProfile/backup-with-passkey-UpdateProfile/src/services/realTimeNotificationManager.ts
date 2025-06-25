/**
 * Real-time notification manager
 * Handles automatic notification generation based on system events
 */

import { UserRole } from '../types';

export interface NotificationRefreshOptions {
  reason?: string;
  delayMs?: number;
}

class RealTimeNotificationManager {
  private static instance: RealTimeNotificationManager;
  private refreshCallbacks: Array<() => Promise<void>> = [];
  private lastRefresh: number = 0;
  private readonly MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refreshes

  private constructor() {}

  static getInstance(): RealTimeNotificationManager {
    if (!RealTimeNotificationManager.instance) {
      RealTimeNotificationManager.instance = new RealTimeNotificationManager();
    }
    return RealTimeNotificationManager.instance;
  }

  /**
   * Register a callback to be called when notifications need to be refreshed
   */
  registerRefreshCallback(callback: () => Promise<void>): void {
    this.refreshCallbacks.push(callback);
  }

  /**
   * Unregister a callback
   */
  unregisterRefreshCallback(callback: () => Promise<void>): void {
    const index = this.refreshCallbacks.indexOf(callback);
    if (index > -1) {
      this.refreshCallbacks.splice(index, 1);
    }
  }

  /**
   * Trigger notification refresh for all registered callbacks
   */
  async triggerRefresh(options: NotificationRefreshOptions = {}): Promise<void> {
    const now = Date.now();
    
    // Prevent too frequent refreshes
    if (now - this.lastRefresh < this.MIN_REFRESH_INTERVAL) {
      console.log('Skipping notification refresh due to rate limiting');
      return;
    }

    console.log(`🔔 Triggering notification refresh${options.reason ? ` (${options.reason})` : ''}`);
    
    if (options.delayMs && options.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs));
    }

    this.lastRefresh = now;

    // Call all registered refresh callbacks
    const promises = this.refreshCallbacks.map(callback => 
      callback().catch(error => 
        console.error('Error in notification refresh callback:', error)
      )
    );

    await Promise.all(promises);
  }

  /**
   * Event handler for candidacy withdrawal
   */
  async onCandidacyWithdrawal(userCurp: string): Promise<void> {
    await this.triggerRefresh({ 
      reason: `candidacy withdrawal by ${userCurp}`,
      delayMs: 1000 // Small delay to ensure database is updated
    });
  }

  /**
   * Event handler for new user registration
   */
  async onUserRegistration(userCurp: string): Promise<void> {
    await this.triggerRefresh({ 
      reason: `new user registration ${userCurp}`,
      delayMs: 500
    });
  }

  /**
   * Event handler for user status changes that might affect notifications
   */
  async onUserStatusChange(userCurp: string, changeType: string): Promise<void> {
    await this.triggerRefresh({ 
      reason: `user status change ${changeType} for ${userCurp}`,
      delayMs: 500
    });
  }

  /**
   * Event handler for voting period changes
   */
  async onVotingPeriodChange(): Promise<void> {
    await this.triggerRefresh({ 
      reason: 'voting period change',
      delayMs: 1000
    });
  }

  /**
   * Event handler for nomination period changes
   */
  async onNominationPeriodChange(): Promise<void> {
    await this.triggerRefresh({ 
      reason: 'nomination period change',
      delayMs: 1000
    });
  }

  /**
   * Manual refresh trigger for admin actions
   */
  async onAdminAction(actionType: string): Promise<void> {
    await this.triggerRefresh({ 
      reason: `admin action: ${actionType}`,
      delayMs: 300
    });
  }
}

export const realTimeNotificationManager = RealTimeNotificationManager.getInstance();

// Convenience functions for common events
export const notifyOnCandidacyWithdrawal = (userCurp: string) => 
  realTimeNotificationManager.onCandidacyWithdrawal(userCurp);

export const notifyOnUserRegistration = (userCurp: string) => 
  realTimeNotificationManager.onUserRegistration(userCurp);

export const notifyOnUserStatusChange = (userCurp: string, changeType: string) => 
  realTimeNotificationManager.onUserStatusChange(userCurp, changeType);

export const notifyOnVotingPeriodChange = () => 
  realTimeNotificationManager.onVotingPeriodChange();

export const notifyOnNominationPeriodChange = () => 
  realTimeNotificationManager.onNominationPeriodChange();

export const notifyOnAdminAction = (actionType: string) => 
  realTimeNotificationManager.onAdminAction(actionType);
