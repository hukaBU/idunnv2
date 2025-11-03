import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const TIER_INFO = {
  connect: {
    name: 'Connect',
    price: '$20/mois',
    color: '#8B5CF6',
  },
  baseline: {
    name: 'Baseline',
    price: '$599/an',
    color: '#F59E0B',
  },
};

export default function UpgradeScreen() {
  const { tier } = useLocalSearchParams<{ tier: 'connect' | 'baseline' }>();
  const { token, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Mock payment form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const tierInfo = tier ? TIER_INFO[tier] : TIER_INFO.connect;

  const handleSubscribe = async () => {
    // Basic validation
    if (!cardNumber || !expiry || !cvv || !name) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Call the backend to upgrade tier
      await axios.post(
        `${API_URL}/tier/upgrade`,
        { new_tier: tier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh user data to update tier
      await refreshUser();

      // Success!
      Alert.alert(
        'Félicitations! 🎉',
        `Vous êtes maintenant membre ${tierInfo.name}! Profitez de toutes les fonctionnalités.`,
        [
          {
            text: 'Génial!',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', "Échec de l'upgrade. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Plan Summary */}
          <View style={[styles.planSummary, { backgroundColor: tierInfo.color + '15' }]}>
            <View style={styles.planSummaryHeader}>
              <Text style={styles.planName}>{tierInfo.name}</Text>
              <Text style={[styles.planPrice, { color: tierInfo.color }]}>{tierInfo.price}</Text>
            </View>
            <View style={styles.mockBadge}>
              <Ionicons name="information-circle" size={16} color="#6B7280" />
              <Text style={styles.mockText}>Mode Démo - Aucun paiement réel</Text>
            </View>
          </View>

          {/* Mock Payment Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Informations de Paiement</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de Carte</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={19}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expiration</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/AA"
                    value={expiry}
                    onChangeText={setExpiry}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>CVV</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom sur la Carte</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.securityText}>
              Paiement sécurisé • Chiffrement SSL • Annulation facile
            </Text>
          </View>
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: tierInfo.color }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>S'abonner Maintenant</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  planSummary: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  planSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
