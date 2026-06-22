import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MatchTimerManager {
  private readonly logger = new Logger(MatchTimerManager.name);
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Add a new timer for a match
   */
  addTimer(matchId: string, timeoutId: NodeJS.Timeout) {
    if (this.timers.has(matchId)) {
      this.clearMatchTimer(matchId);
    }
    this.timers.set(matchId, timeoutId);
    this.logger.debug(`Added timer for match ${matchId}`);
  }

  /**
   * Clear an existing timer for a match
   */
  clearMatchTimer(matchId: string) {
    const timer = this.timers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(matchId);
      this.logger.debug(`Cleared timer for match ${matchId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all currently active timers (e.g. for debugging)
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }
}
