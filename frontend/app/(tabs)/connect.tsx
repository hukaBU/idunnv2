import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import UpsellModal from '../../components/UpsellModal';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Wearable {
  id: string;
  wearable_type: string;
  connected_at: string;
}

const WEARABLES = [
  { id: 'apple_health', name: 'Apple Health', icon: 'phone-portrait', color: '#000' },
  { id: 'google_fit', name: 'Google Fit', icon: 'fitness', color: '#4285F4' },
  { id: 'oura', name: 'Oura Ring', icon: 'ellipse', color: '#0070C9' },
  { id: 'garmin', name: 'Garmin', icon: 'watch', color: '#007CC3' },
  { id: 'whoop', name: 'WHOOP', icon: 'analytics', color: '#FF3E3E' },
];

export default function ConnectScreen() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [connectedWearables, setConnectedWearables] = useState<Wearable[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [selectedWearable, setSelectedWearable] = useState('');

  useEffect(() => {
    loadConnectedWearables();
  }, []);

  const loadConnectedWearables = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/wearable/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnectedWearables(response.data);
    } catch (error) {
      console.error('Error loading wearables:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWearable = async (wearableType: string) => {
    try {
      await axios.post(
        `${API_URL}/v1/wearable/connect`,
        { wearable_type: wearableType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', `${wearableType.replace('_', ' ').toUpperCase()} connected!`);
      loadConnectedWearables();
    } catch (error: any) {
      if (error.response?.status === 403) {
        setSelectedWearable(wearableType);
        setUpgradeModalVisible(true);
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to connect wearable');
      }
    }
  };

  const isConnected = (wearableType: string) => {
    return connectedWearables.some((w) => w.wearable_type === wearableType);
  };

  const getTierRequirement = () => {
    if (user?.tier === 'free') {
      return connectedWearables.length >= 1 ? 'connect' : null;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Devices</Text>
          <Text style={styles.subtitle}>
            Sync data from your favorite wearables
          </Text>
        </View>

        {/* Tier Info */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Ionicons name="information-circle" size={24} color="#4F46E5" />
            <View style={styles.tierText}>
              <Text style={styles.tierTitle}>Your Plan: {user?.tier?.toUpperCase()}</Text>
              <Text style={styles.tierSubtitle}>
                {user?.tier === 'free'
                  ? `Connected: ${connectedWearables.length}/1 device`
                  : 'Unlimited device connections'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wearables List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          {WEARABLES.map((wearable) => {
            const connected = isConnected(wearable.id);
            const requiresUpgrade = user?.tier === 'free' && connectedWearables.length >= 1 && !connected;

            return (
              <TouchableOpacity
                key={wearable.id}
                style={[
                  styles.wearableCard,
                  connected && styles.wearableCardConnected,
                  requiresUpgrade && styles.wearableCardLocked,
                ]}
                onPress={() => {
                  if (connected) {
                    Alert.alert('Already Connected', 'This device is already connected');
                  } else {
                    connectWearable(wearable.id);
                  }
                }}
                disabled={connected}
              >
                <View style={[styles.wearableIcon, { backgroundColor: wearable.color + '20' }]}>
                  <Ionicons name={wearable.icon as any} size={24} color={wearable.color} />
                </View>
                <View style={styles.wearableInfo}>
                  <Text style={styles.wearableName}>{wearable.name}</Text>
                  <Text style={styles.wearableStatus}>
                    {connected ? 'Connected' : requiresUpgrade ? 'Requires upgrade' : 'Tap to connect'}
                  </Text>
                </View>
                {connected ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : requiresUpgrade ? (
                  <Ionicons name="lock-closed" size={24} color="#F59E0B" />
                ) : (
                  <Ionicons name="add-circle" size={24} color="#4F46E5" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <UpsellModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        currentTier={user?.tier || 'free'}
        triggeredFeature={selectedWearable ? `Connexion ${selectedWearable}` : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tierCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    marginLeft: 12,
    flex: 1,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  tierSubtitle: {
    fontSize: 14,
    color: '#6366F1',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  wearableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wearableCardConnected: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  wearableCardLocked: {
    opacity: 0.6,
  },
  wearableIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wearableInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wearableName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  wearableStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  modalBold: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalButtonPrimary: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    marginTop: 12,
  },
  modalButtonSecondaryText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
