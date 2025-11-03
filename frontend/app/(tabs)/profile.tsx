import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const TIER_INFO = {
  free: {
    name: 'Free',
    price: '$0',
    color: '#6B7280',
    features: [
      'Manual tracking',
      '1 wearable connection',
      'Basic chat assistant',
      'Weekly insights',
    ],
  },
  connect: {
    name: 'Connect',
    price: '$20/month',
    color: '#8B5CF6',
    features: [
      'Everything in Free',
      'Unlimited wearable connections',
      'PDF upload (blood tests)',
      'Advanced insights',
      'Priority support',
    ],
  },
  baseline: {
    name: 'Baseline',
    price: '$599/year',
    color: '#F59E0B',
    features: [
      'Everything in Connect',
      'Annual health baseline assessment',
      'Personalized wellness plans',
      'Direct expert consultations',
      'Premium marketplace access',
    ],
  },
};

export default function ProfileScreen() {
  const { user, logout, refreshUser, token } = useAuth();
  const router = useRouter();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'connect' | 'baseline' | null>(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleUpgrade = async (tier: 'connect' | 'baseline') => {
    // In production, this would integrate with Stripe
    // For MVP, we'll simulate the upgrade
    try {
      await axios.post(
        `${API_URL}/tier/upgrade`,
        { new_tier: tier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refreshUser();
      setUpgradeModalVisible(false);
      Alert.alert('Success!', `You've been upgraded to ${TIER_INFO[tier].name} tier!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade. Please try again.');
    }
  };

  const openUpgradeModal = (tier: 'connect' | 'baseline') => {
    setSelectedTier(tier);
    setUpgradeModalVisible(true);
  };

  const currentTier = user?.tier as keyof typeof TIER_INFO || 'free';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.tierBadge, { backgroundColor: TIER_INFO[currentTier].color }]}>
            <Text style={styles.tierBadgeText}>{TIER_INFO[currentTier].name} Member</Text>
          </View>
        </View>

        {/* Current Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={[styles.planCard, { borderColor: TIER_INFO[currentTier].color }]}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{TIER_INFO[currentTier].name}</Text>
              <Text style={styles.planPrice}>{TIER_INFO[currentTier].price}</Text>
            </View>
            <View style={styles.featuresList}>
              {TIER_INFO[currentTier].features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={TIER_INFO[currentTier].color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Upgrade Options */}
        {currentTier !== 'baseline' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>
            
            {currentTier === 'free' && (
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => openUpgradeModal('connect')}
              >
                <View style={styles.upgradeHeader}>
                  <View>
                    <Text style={styles.upgradeName}>Connect</Text>
                    <Text style={styles.upgradePrice}>$20/month</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={32} color="#8B5CF6" />
                </View>
                <Text style={styles.upgradeDescription}>
                  Unlock unlimited wearable connections and advanced features
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={() => openUpgradeModal('baseline')}
            >
              <View style={styles.upgradeHeader}>
                <View>
                  <Text style={styles.upgradeName}>Baseline</Text>
                  <Text style={styles.upgradePrice}>$599/year</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.upgradeDescription}>
                Complete wellness package with expert consultations and personalized plans
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setUpgradeModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>

            {selectedTier && (
              <>
                <Text style={styles.modalTitle}>Upgrade to {TIER_INFO[selectedTier].name}</Text>
                <Text style={styles.modalPrice}>{TIER_INFO[selectedTier].price}</Text>

                <View style={styles.modalFeatures}>
                  {TIER_INFO[selectedTier].features.map((feature, index) => (
                    <View key={index} style={styles.modalFeatureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={TIER_INFO[selectedTier].color}
                      />
                      <Text style={styles.modalFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalNote}>
                  <Ionicons name="information-circle" size={20} color="#6B7280" />
                  <Text style={styles.modalNoteText}>
                    This is a demo. In production, this would connect to Stripe for payment.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: TIER_INFO[selectedTier].color }]}
                  onPress={() => handleUpgrade(selectedTier)}
                >
                  <Text style={styles.modalButtonText}>Simulate Upgrade (Demo)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4F46E5',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  upgradeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  upgradePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 24,
  },
  modalFeatures: {
    gap: 16,
    marginBottom: 24,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFeatureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  modalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalNoteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
