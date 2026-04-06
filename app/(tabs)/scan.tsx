import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Camera, X, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Camera size={48} color="#10b981" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need your permission to access the camera for scanning restaurant menus
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleStartRecording = async () => {
    if (!cameraRef.current) return;

    if (Platform.OS === 'web') {
      setError('Video recording is not supported on web. Please use a mobile device.');
      return;
    }

    try {
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(false);

      if (Platform.OS === 'web') {
        setShowForm(true);
        return;
      }

      setRecordedVideo('placeholder_video_uri');
      setShowForm(true);
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording');
    }
  };

  const handleSubmitScan = async () => {
    setLoading(true);
    setError('');

    try {
      const videoUrl = recordedVideo || 'demo_video_url';

      const { data: scanData, error: scanError } = await supabase
        .from('menu_scans')
        .insert({
          user_id: user?.id,
          restaurant_name: restaurantName || 'Unknown Restaurant',
          video_url: videoUrl,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (scanError) throw scanError;

      const mockRecommendations = [
        {
          scan_id: scanData.id,
          user_id: user?.id,
          dish_name: 'Grilled Chicken Salad',
          description: 'Fresh greens with grilled chicken breast',
          estimated_calories: 350,
          protein_g: 42,
          carbs_g: 15,
          fat_g: 12,
          recommendation_reason: 'High in protein, low in carbs - perfect for your muscle building goal',
          health_score: 95,
        },
        {
          scan_id: scanData.id,
          user_id: user?.id,
          dish_name: 'Quinoa Power Bowl',
          description: 'Quinoa with roasted vegetables and chickpeas',
          estimated_calories: 420,
          protein_g: 18,
          carbs_g: 52,
          fat_g: 14,
          recommendation_reason: 'Balanced macros with complex carbs for sustained energy',
          health_score: 88,
        },
      ];

      const { error: recError } = await supabase
        .from('recommendations')
        .insert(mockRecommendations);

      if (recError) throw recError;

      await supabase
        .from('menu_scans')
        .update({ processing_status: 'completed' })
        .eq('id', scanData.id);

      setRecordedVideo(null);
      setRestaurantName('');
      setShowForm(false);
      router.push('/(tabs)/history');
    } catch (err: any) {
      console.error('Error submitting scan:', err);
      setError(err.message || 'Failed to submit scan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setRecordedVideo(null);
    setRestaurantName('');
    setShowForm(false);
    setIsRecording(false);
  };

  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <CheckCircle size={64} color="#10b981" />
          <Text style={styles.formTitle}>Video Recorded!</Text>
          <Text style={styles.formSubtitle}>
            Add optional details about the restaurant
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Restaurant Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder="e.g., The Healthy Cafe"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmitScan}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Processing...' : 'Get Recommendations'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.webPlaceholder}>
          <Camera size={64} color="#d1d5db" />
          <Text style={styles.webPlaceholderTitle}>Camera Not Available</Text>
          <Text style={styles.webPlaceholderText}>
            Video recording is only available on mobile devices. Please use the mobile app to scan menus.
          </Text>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setRecordedVideo('demo');
              setShowForm(true);
            }}
          >
            <Text style={styles.demoButtonText}>Try Demo Mode</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>
                {isRecording ? 'Recording...' : 'Scan Restaurant Menu'}
              </Text>
              {isRecording && <View style={styles.recordingIndicator} />}
            </View>

            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.instructionText}>
                {isRecording
                  ? 'Pan slowly through the menu'
                  : 'Position menu in frame and start recording'}
              </Text>
              <View style={styles.aiDisclosure}>
                <Text style={styles.aiDisclosureText}>
                  Powered by AI • Your health data is private
                </Text>
              </View>
            </View>

            <View style={styles.cameraControls}>
              {!isRecording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={handleStartRecording}
                >
                  <View style={styles.recordButtonInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStopRecording}
                >
                  <View style={styles.stopButtonInner} />
                </TouchableOpacity>
              )}
            </View>
          </CameraView>

          {error ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color="#dc2626" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scanFrame: {
    width: '90%',
    height: '60%',
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  instructionText: {
    marginTop: 24,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  aiDisclosure: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  aiDisclosureText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  cameraControls: {
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
  stopButtonInner: {
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  permissionBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    width: '100%',
  },
  errorBanner: {
    position: 'absolute',
    top: 120,
    left: 24,
    right: 24,
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  webPlaceholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  webPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  demoButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
