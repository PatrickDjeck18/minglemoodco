import { useState, useEffect } from 'react';
import TrackingService, { TrackingStatus } from '../services/TrackingService';

export const useTracking = () => {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    status: 'not-determined',
    canTrack: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkTrackingStatus();
  }, []);

  const checkTrackingStatus = async () => {
    try {
      const status = await TrackingService.getCurrentStatus();
      setTrackingStatus(status);
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const requestTrackingPermission = async () => {
    setIsLoading(true);
    try {
      const status = await TrackingService.requestPermission();
      setTrackingStatus(status);
      return status;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return { status: 'denied', canTrack: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trackingStatus,
    isLoading,
    requestTrackingPermission,
    checkTrackingStatus
  };
};
