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
import { useRouter } from 'expo-router';
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

interface Insight {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  recommended_product_id: string | null;
  icon: string;
  timestamp: string;
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
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadInsights();
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

  const loadInsights = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data.insights || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
    loadInsights();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'normal':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderInsightCard = (insight: Insight) => (
    <View
      key={insight.id}
      style={[
        styles.insightCard,
        { borderLeftColor: getPriorityColor(insight.priority), borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.insightHeader}>
        <Ionicons name={insight.icon as any} size={24} color={getPriorityColor(insight.priority)} />
        <View style={styles.insightHeaderText}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightPriority}>{insight.priority.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.insightMessage}>{insight.message}</Text>
      
      {insight.recommended_product_id && (
        <TouchableOpacity
          style={styles.productRecommendation}
          onPress={() => router.push(`/product/${insight.recommended_product_id}` as any)}
        >
          <Ionicons name="cart" size={20} color="#4F46E5" />
          <Text style={styles.productRecommendationText}>Voir le produit recommandé</Text>
          <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
        </TouchableOpacity>
      )}
    </View>
  );

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
            <Text style={styles.greeting}>Bonjour, {user?.email?.split('@')[0]}!</Text>
            <Text style={styles.subtitle}>Bienvenue sur votre tableau de bord bien-être</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(user?.tier || 'free') }]}>
            <Text style={styles.tierText}>{getTierLabel(user?.tier || 'free')}</Text>
          </View>
        </View>

        {/* Wellness Insights (from Brain) */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={24} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Vos Insights Personnalisés</Text>
            </View>
            {insights.map(renderInsightCard)}
          </View>
        )}

        {/* Quick Stats */}
        {dashboard && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité Récente</Text>
            {dashboard.recent_logs && dashboard.recent_logs.length > 0 ? (
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
              <Text style={styles.emptyText}>Commencez à suivre vos données!</Text>
            )}
          </View>
        )}

        {/* Connected Devices */}
        {dashboard && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appareils Connectés</Text>
            {dashboard.connected_wearables && dashboard.connected_wearables.length > 0 ? (
              dashboard.connected_wearables.map((wearable) => (
                <View key={wearable.id} style={styles.wearableCard}>
                  <Ionicons name="watch" size={24} color="#4F46E5" />
                  <Text style={styles.wearableName}>
                    {wearable.wearable_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedText}>Connecté</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucun appareil connecté</Text>
            )}
          </View>
        )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  insightPriority: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  insightMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  productRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  productRecommendationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
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
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
