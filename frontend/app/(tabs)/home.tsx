import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface HealthLog {
  id: string;
  metric_type: string;
  value: number;
  data_source: string;
  timestamp: string;
}

interface Wearable {
  id: string;
  wearable_type: string;
  connected_at: string;
}

interface DashboardData {
  recent_logs: HealthLog[];
  connected_wearables: Wearable[];
  insights: {
    sleep: string;
    hydration: string;
  };
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'baseline':
        return '#F59E0B';
      case 'connect':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'water_ml':
        return 'water';
      case 'sleep_hours':
        return 'moon';
      case 'stress_level':
        return 'pulse';
      case 'steps':
        return 'walk';
      default:
        return 'fitness';
    }
  };

  const formatMetricValue = (metric: string, value: number) => {
    switch (metric) {
      case 'water_ml':
        return `${Math.round(value)}ml`;
      case 'sleep_hours':
        return `${value.toFixed(1)}h`;
      case 'steps':
        return `${Math.round(value)} steps`;
      case 'stress_level':
        return `${value}/10`;
      default:
        return value.toString();
    }
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
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0]}!</Text>
            <Text style={styles.subtitle}>Welcome to your wellness dashboard</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(user?.tier || 'free') }]}>
            <Text style={styles.tierText}>{getTierLabel(user?.tier || 'free')}</Text>
          </View>
        </View>

        {/* Insights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="moon" size={24} color="#4F46E5" />
            <Text style={styles.insightText}>{dashboard?.insights.sleep}</Text>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="water" size={24} color="#06B6D4" />
            <Text style={styles.insightText}>{dashboard?.insights.hydration}</Text>
          </View>
        </View>

        {/* Connected Wearables */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Devices</Text>
          {dashboard?.connected_wearables && dashboard.connected_wearables.length > 0 ? (
            dashboard.connected_wearables.map((wearable) => (
              <View key={wearable.id} style={styles.wearableCard}>
                <Ionicons name="watch" size={24} color="#4F46E5" />
                <Text style={styles.wearableName}>
                  {wearable.wearable_type.replace('_', ' ').toUpperCase()}
                </Text>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No wearables connected yet</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {dashboard?.recent_logs && dashboard.recent_logs.length > 0 ? (
            dashboard.recent_logs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.logCard}>
                <Ionicons name={getMetricIcon(log.metric_type) as any} size={20} color="#6B7280" />
                <View style={styles.logInfo}>
                  <Text style={styles.logMetric}>
                    {log.metric_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.logSource}>{log.data_source}</Text>
                </View>
                <Text style={styles.logValue}>{formatMetricValue(log.metric_type, log.value)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No activity logged yet. Start tracking!</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightCard: {
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
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  wearableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  wearableName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  connectedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  connectedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
    marginLeft: 12,
  },
  logMetric: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  logSource: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
