import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function SkinScannerScreen() {
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
            Nous avons besoin d'accéder à votre caméra frontale pour analyser votre peau
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
        quality: 0.8,
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
        name: 'skin_scan.jpg',
      } as any);

      const response = await axios.post(`${API_URL}/v1/scan/skin`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Navigate to results screen
      router.push({
        pathname: '/skin-results',
        params: {
          analysisData: JSON.stringify(response.data),
        },
      } as any);
    } catch (error: any) {
      console.error('Skin scan error:', error);
      Alert.alert(
        'Erreur de Scan',
        error.response?.data?.detail || 'Impossible d\'analyser la peau. Réessayez.'
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
          <Text style={styles.headerTitle}>Analyse de Peau</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          {/* Facial Overlay Guide */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop}>
              <Text style={styles.guideText}>Positionnez votre visage dans l'ovale</Text>
            </View>
            
            {/* SVG Face Outline */}
            <Svg height="400" width="320" style={styles.faceOutline}>
              {/* Face oval */}
              <Ellipse
                cx="160"
                cy="200"
                rx="120"
                ry="160"
                stroke="#fff"
                strokeWidth="3"
                fill="transparent"
              />
              {/* Left eye guide */}
              <Circle
                cx="120"
                cy="170"
                r="15"
                stroke="#fff"
                strokeWidth="2"
                fill="transparent"
                opacity="0.5"
              />
              {/* Right eye guide */}
              <Circle
                cx="200"
                cy="170"
                r="15"
                stroke="#fff"
                strokeWidth="2"
                fill="transparent"
                opacity="0.5"
              />
            </Svg>

            <View style={styles.overlayBottom} />
          </View>
        </CameraView>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.instructionsContainer}>
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text style={styles.instructions}>
              Assurez-vous d'avoir un bon éclairage et regardez directement la caméra
            </Text>
          </View>

          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="sunny" size={16} color="#F59E0B" />
              <Text style={styles.tipText}>Bon éclairage</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="glasses-outline" size={16} color="#6B7280" />
              <Text style={styles.tipText}>Sans lunettes</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="water-outline" size={16} color="#06B6D4" />
              <Text style={styles.tipText}>Visage propre</Text>
            </View>
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
            <Text style={styles.processingText}>Analyse de la peau en cours...</Text>
          )}

          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.safetyText}>
              Analyse bien-être uniquement • Pas de diagnostic médical
            </Text>
          </View>
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
    backgroundColor: '#8B5CF6',
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
  overlayTop: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  faceOutline: {
    marginTop: 60,
  },
  guideText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  instructions: {
    flex: 1,
    fontSize: 12,
    color: '#8B5CF6',
    lineHeight: 18,
  },
  tipsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
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
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  safetyText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
});
