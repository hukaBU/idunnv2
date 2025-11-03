import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function TrackScreen() {
  const { token } = useAuth();
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [stress, setStress] = useState('');
  const [loading, setLoading] = useState(false);

  const logMetric = async (metricType: string, value: string) => {
    if (!value || isNaN(parseFloat(value))) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/v1/log`,
        {
          data_source: 'manual',
          metric_type: metricType,
          value: parseFloat(value),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Metric logged successfully!');
      
      // Clear the input
      if (metricType === 'water_ml') setWater('');
      if (metricType === 'sleep_hours') setSleep('');
      if (metricType === 'stress_level') setStress('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log metric');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Track Your Wellness</Text>
          <Text style={styles.subtitle}>Log your daily health metrics</Text>
        </View>

        {/* Water Intake */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="water" size={28} color="#06B6D4" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Water Intake</Text>
              <Text style={styles.cardSubtitle}>Track your hydration</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Amount in ml (e.g., 250)"
              value={water}
              onChangeText={setWater}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.logButton, loading && styles.buttonDisabled]}
              onPress={() => logMetric('water_ml', water)}
              disabled={loading}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon" size={28} color="#8B5CF6" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Sleep Duration</Text>
              <Text style={styles.cardSubtitle}>Last night's sleep</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Hours (e.g., 7.5)"
              value={sleep}
              onChangeText={setSleep}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.logButton, loading && styles.buttonDisabled]}
              onPress={() => logMetric('sleep_hours', sleep)}
              disabled={loading}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stress Level */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse" size={28} color="#EF4444" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Stress Level</Text>
              <Text style={styles.cardSubtitle}>Rate 1-10 (1 = low, 10 = high)</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Level (1-10)"
              value={stress}
              onChangeText={setStress}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.logButton, loading && styles.buttonDisabled]}
              onPress={() => logMetric('stress_level', stress)}
              disabled={loading}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            Manual tracking is available for all users. Connect wearables to automatically sync data!
          </Text>
        </View>
      </ScrollView>
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
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  logButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
});
