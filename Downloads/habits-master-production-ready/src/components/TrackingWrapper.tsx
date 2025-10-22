import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import TrackingPermissionModal from './TrackingPermissionModal';
import { useTracking } from '../hooks/useTracking';

interface TrackingWrapperProps {
  children: React.ReactNode;
  onTrackingStatusChange?: (canTrack: boolean) => void;
}

const TrackingWrapper: React.FC<TrackingWrapperProps> = ({
  children,
  onTrackingStatusChange
}) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { trackingStatus, checkTrackingStatus } = useTracking();

  useEffect(() => {
    // Only show permission modal on iOS and if status is not determined
    if (Platform.OS === 'ios' && trackingStatus.status === 'not-determined') {
      setShowPermissionModal(true);
    }
  }, [trackingStatus.status]);

  useEffect(() => {
    // Notify parent component about tracking status changes
    onTrackingStatusChange?.(trackingStatus.canTrack);
  }, [trackingStatus.canTrack, onTrackingStatusChange]);

  const handlePermissionGranted = () => {
    console.log('Tracking permission granted');
    // You can initialize any tracking services here
    // For example, initialize analytics, ad networks, etc.
  };

  const handlePermissionDenied = () => {
    console.log('Tracking permission denied');
    // Handle the case where user denied tracking
    // You might want to show a different ad experience or disable certain features
  };

  return (
    <>
      {children}
      <TrackingPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </>
  );
};

export default TrackingWrapper;
