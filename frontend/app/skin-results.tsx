import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface SkinAnalysis {
  hydration_level: string;
  pore_visibility: string;
  fine_lines: string;
  skin_tone: string;
  radiance: string;
  texture: string;
  overall_score: number;
  recommendations: {
    products: string[];
    routine: string[];
  };
}

export default function SkinResultsScreen() {
  const { analysisData } = useLocalSearchParams<{ analysisData: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);

  useEffect(() => {
    if (analysisData) {
      try {
        const data = JSON.parse(analysisData);
        setAnalysis(data.analysis);
      } catch (error) {
        console.error('Error parsing analysis data:', error);
      }
    }
  }, [analysisData]);

  if (!analysis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bien';
    return 'Peut s\'améliorer';
  };

  const getMetricIcon = (metric: string): any => {
    switch (metric) {
      case 'hydration_level':
        return 'water';
      case 'pore_visibility':
        return 'scan';
      case 'fine_lines':
        return 'git-branch';
      case 'skin_tone':
        return 'color-palette';
      case 'radiance':
        return 'sunny';
      case 'texture':
        return 'finger-print';
      default:
        return 'analytics';
    }
  };

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      hydration_level: 'Hydratation',
      pore_visibility: 'Visibilité des Pores',
      fine_lines: 'Ridules',
      skin_tone: 'Teint',
      radiance: 'Éclat',
      texture: 'Texture',
    };
    return labels[metric] || metric;
  };

  const getMetricBar = (value: string) => {
    const levels: { [key: string]: number } = {
      low: 1,
      minimal: 1,
      even: 3,
      smooth: 3,
      radiant: 3,
      medium: 2,
      normal: 2,
      visible: 2,
      moderate: 2,
      slightly_uneven: 2,
      high: 3,
      prominent: 3,
      rough: 1,
      dull: 1,
    };
    return levels[value] || 2;
  };

  const renderMetricBar = (level: number) => {
    return (
      <View style={styles.metricBarContainer}>
        {[1, 2, 3].map((bar) => (
          <View
            key={bar}
            style={[
              styles.metricBarSegment,
              bar <= level && styles.metricBarSegmentActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const navigateToMarketplace = () => {
    router.push('/(tabs)/marketplace?category=skin' as any);
  };

  const metrics = [
    { key: 'hydration_level', value: analysis.hydration_level },
    { key: 'pore_visibility', value: analysis.pore_visibility },
    { key: 'fine_lines', value: analysis.fine_lines },
    { key: 'radiance', value: analysis.radiance },
    { key: 'texture', value: analysis.texture },
    { key: 'skin_tone', value: analysis.skin_tone },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Résultats d'Analyse</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Success Banner */}
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.successTitle}>Analyse Terminée!</Text>
            <Text style={styles.successSubtitle}>Voici vos résultats bien-être</Text>
          </View>

          {/* Overall Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Score Global de Bien-Être</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysis.overall_score) }]}>
                {analysis.overall_score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={[styles.scoreStatus, { color: getScoreColor(analysis.overall_score) }]}>
              {getScoreLabel(analysis.overall_score)}
            </Text>
          </View>

          {/* Wellness Metrics (NOT medical) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Métriques Bien-Être</Text>
            </View>
            
            {metrics.map((metric) => (
              <View key={metric.key} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricTitleRow}>
                    <Ionicons name={getMetricIcon(metric.key)} size={20} color="#6B7280" />
                    <Text style={styles.metricName}>{getMetricLabel(metric.key)}</Text>
                  </View>
                  <Text style={styles.metricValue}>{metric.value.replace('_', ' ')}</Text>
                </View>
                {renderMetricBar(getMetricBar(metric.value))}
              </View>
            ))}
          </View>

          {/* Product Recommendations */}
          {analysis.recommendations.products.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cart" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Produits Recommandés</Text>
              </View>
              {analysis.recommendations.products.map((product, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />
                  <Text style={styles.recommendationText}>{product}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Routine Recommendations */}
          {analysis.recommendations.routine.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Conseils Routine</Text>
              </View>
              {analysis.recommendations.routine.map((tip, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <Text style={styles.recommendationText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Safety Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.disclaimerText}>
              Ces résultats sont des métriques de bien-être uniquement, pas un diagnostic médical.
              Consultez un dermatologue pour tout problème médical.
            </Text>
          </View>
        </ScrollView>

        {/* MONETIZATION: Call to Action */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.marketplaceButton} onPress={navigateToMarketplace}>
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.marketplaceButtonText}>Voir les Produits Recommandés</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerButton: {
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
  successBanner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
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
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricHeader: {
    marginBottom: 12,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  metricValue: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metricBarContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  metricBarSegment: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  metricBarSegmentActive: {
    backgroundColor: '#8B5CF6',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  marketplaceButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  marketplaceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
