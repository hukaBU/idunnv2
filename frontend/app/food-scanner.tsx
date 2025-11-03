import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function FoodScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { token } = useAuth();

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Permission Caméra Requise</Text>
          <Text style={styles.permissionText}>
            Nous avons besoin d'accéder à votre caméra pour scanner vos repas
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la Caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo || !photo.uri) {
        Alert.alert('Erreur', 'Impossible de prendre la photo');
        setIsProcessing(false);
        return;
      }

      // Upload photo to backend
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'food_scan.jpg',
      } as any);

      const response = await axios.post(`${API_URL}/v1/scan/food`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Navigate to confirmation screen with results
      router.push({
        pathname: '/food-confirmation',
        params: {
          scanData: JSON.stringify(response.data),
        },
      } as any);
    } catch (error: any) {
      console.error('Food scan error:', error);
      Alert.alert(
        'Erreur de Scan',
        error.response?.data?.detail || 'Impossible de scanner le repas. Réessayez.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner un Repas</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Overlay Guide */}
          <View style={styles.overlay}>
            <View style={styles.guideBox} />
            <Text style={styles.guideText}>Cadrez votre repas dans le carré</Text>
          </View>
        </CameraView>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle" size={20} color="#4F46E5" />
            <Text style={styles.instructions}>
              Prenez une photo claire de votre repas pour une reconnaissance optimale
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {isProcessing && (
            <Text style={styles.processingText}>Analyse en cours...</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  instructions: {
    flex: 1,
    fontSize: 12,
    color: '#4F46E5',
    lineHeight: 18,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
  },
});
