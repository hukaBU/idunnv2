import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UpsellModalProps {
  visible: boolean;
  onClose: () => void;
  currentTier: string;
  triggeredFeature?: string;
}

const TIER_INFO = {
  connect: {
    name: 'Connect',
    price: '$20',
    period: '/mois',
    color: '#8B5CF6',
    features: [
      'Tout de Free',
      'Connexions illimitées de wearables',
      'Upload de PDFs (tests sanguins)',
      'Insights avancés',
      'Support prioritaire',
    ],
  },
  baseline: {
    name: 'Baseline',
    price: '$599',
    period: '/an',
    color: '#F59E0B',
    features: [
      'Tout de Connect',
      'Évaluation santé annuelle',
      'Plans wellness personnalisés',
      'Consultations experts directes',
      'Accès marketplace premium',
    ],
  },
};

export default function UpsellModal({
  visible,
  onClose,
  currentTier,
  triggeredFeature,
}: UpsellModalProps) {
  const router = useRouter();

  const handleUpgrade = (tier: 'connect' | 'baseline') => {
    onClose();
    router.push(`/upgrade/${tier}` as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#6B7280" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="lock-closed" size={48} color="#F59E0B" />
              <Text style={styles.title}>Débloquez Plus de Fonctionnalités</Text>
              {triggeredFeature && (
                <Text style={styles.subtitle}>
                  "{triggeredFeature}" nécessite un plan premium
                </Text>
              )}
            </View>

            {/* Connect Plan */}
            <View style={[styles.planCard, { borderColor: TIER_INFO.connect.color }]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{TIER_INFO.connect.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: TIER_INFO.connect.color }]}>
                      {TIER_INFO.connect.price}
                    </Text>
                    <Text style={styles.planPeriod}>{TIER_INFO.connect.period}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featuresList}>
                {TIER_INFO.connect.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={TIER_INFO.connect.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: TIER_INFO.connect.color }]}
                onPress={() => handleUpgrade('connect')}
              >
                <Text style={styles.upgradeButtonText}>Passer à Connect</Text>
              </TouchableOpacity>
            </View>

            {/* Baseline Plan */}
            <View style={[styles.planCard, { borderColor: TIER_INFO.baseline.color }]}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>MEILLEURE VALEUR</Text>
              </View>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{TIER_INFO.baseline.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: TIER_INFO.baseline.color }]}>
                      {TIER_INFO.baseline.price}
                    </Text>
                    <Text style={styles.planPeriod}>{TIER_INFO.baseline.period}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featuresList}>
                {TIER_INFO.baseline.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={TIER_INFO.baseline.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: TIER_INFO.baseline.color }]}
                onPress={() => handleUpgrade('baseline')}
              >
                <Text style={styles.upgradeButtonText}>Passer à Baseline</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Peut-être plus tard</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  upgradeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    padding: 16,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
