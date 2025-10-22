import { Platform } from 'react-native';
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

export interface TrackingStatus {
  status: 'authorized' | 'denied' | 'restricted' | 'not-determined';
  canTrack: boolean;
}

class TrackingService {
  /**
   * Request tracking permission from the user
   * This should be called before any tracking data is collected
   */
  async requestPermission(): Promise<TrackingStatus> {
    if (Platform.OS !== 'ios') {
      // Android doesn't require ATT, return authorized
      return { status: 'authorized', canTrack: true };
    }

    try {
      const status = await requestTrackingPermission();
      return {
        status: status as TrackingStatus['status'],
        canTrack: status === 'authorized'
      };
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return { status: 'denied', canTrack: false };
    }
  }

  /**
   * Get the current tracking permission status
   */
  async getCurrentStatus(): Promise<TrackingStatus> {
    if (Platform.OS !== 'ios') {
      return { status: 'authorized', canTrack: true };
    }

    try {
      const status = await getTrackingStatus();
      return {
        status: status as TrackingStatus['status'],
        canTrack: status === 'authorized'
      };
    } catch (error) {
      console.error('Error getting tracking status:', error);
      return { status: 'denied', canTrack: false };
    }
  }

  /**
   * Check if tracking is authorized
   */
  async canTrack(): Promise<boolean> {
    const status = await this.getCurrentStatus();
    return status.canTrack;
  }
}

export default new TrackingService();
