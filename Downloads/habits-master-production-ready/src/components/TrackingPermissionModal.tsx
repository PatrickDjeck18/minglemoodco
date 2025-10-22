import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { useTracking } from '../hooks/useTracking';

interface TrackingPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const TrackingPermissionModal: React.FC<TrackingPermissionModalProps> = ({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied
}) => {
  const { requestTrackingPermission, isLoading } = useTracking();

  const handleRequestPermission = async () => {
    if (Platform.OS !== 'ios') {
      // Android doesn't require ATT
      onPermissionGranted?.();
      onClose();
      return;
    }

    try {
      const result = await requestTrackingPermission();
      
      if (result.canTrack) {
        onPermissionGranted?.();
        Alert.alert(
          'Permission Granted',
          'Thank you for allowing tracking. This helps us provide you with personalized content and ads.'
        );
      } else {
        onPermissionDenied?.();
        Alert.alert(
          'Permission Denied',
          'You can still use the app, but you may see less personalized content and ads.'
        );
      }
      
      onClose();
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      Alert.alert('Error', 'Failed to request tracking permission.');
      onClose();
    }
  };

  const handleSkip = () => {
    onPermissionDenied?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Personalized Experience</Text>
          
          <Text style={styles.description}>
            We'd like to track your activity across apps and websites to provide you with:
          </Text>
          
          <View style={styles.benefitsList}>
            <Text style={styles.benefit}>• Personalized prayer recommendations</Text>
            <Text style={styles.benefit}>• Relevant spiritual content</Text>
            <Text style={styles.benefit}>• Improved app experience</Text>
            <Text style={styles.benefit}>• Support our ministry through ads</Text>
          </View>
          
          <Text style={styles.privacyNote}>
            Your privacy is important to us. You can change this setting anytime in your device settings.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={handleRequestPermission}
              disabled={isLoading}
            >
              <Text style={styles.allowButtonText}>
                {isLoading ? 'Requesting...' : 'Allow Tracking'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Ask App Not to Track</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    lineHeight: 22,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefit: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  privacyNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  allowButton: {
    backgroundColor: '#5E72E4',
  },
  allowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TrackingPermissionModal;
