import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface DetectedFood {
  item: string;
  qty_g: number;
  calories: number;
  confidence: number;
}

export default function FoodConfirmationScreen() {
  const { scanData } = useLocalSearchParams<{ scanData: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [scanId, setScanId] = useState('');
  const [nutrition, setNutrition] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanData) {
      try {
        const data = JSON.parse(scanData);
        setFoods(data.detected_foods || []);
        setScanId(data.scan_id || '');
        setNutrition(data.nutrition || null);
      } catch (error) {
        console.error('Error parsing scan data:', error);
        Alert.alert('Erreur', 'Données de scan invalides');
        router.back();
      }
    }
  }, [scanData]);

  const updateFood = (index: number, field: 'item' | 'qty_g', value: string | number) => {
    const updated = [...foods];
    if (field === 'qty_g') {
      updated[index] = { ...updated[index], qty_g: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], item: String(value) };
    }
    setFoods(updated);
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const addFood = () => {
    setFoods([...foods, { item: '', qty_g: 0, calories: 0, confidence: 0 }]);
  };

  const confirmScan = async () => {
    if (foods.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un aliment');
      return;
    }

    // Validate all foods have item and qty
    const invalid = foods.some(f => !f.item || f.qty_g <= 0);
    if (invalid) {
      Alert.alert('Erreur', 'Tous les aliments doivent avoir un nom et une quantité');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/v1/scan/food/confirm`,
        {
          scan_id: scanId,
          confirmed_foods: foods,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        'Succès! 🎉',
        'Votre repas a été enregistré. Ces données seront utilisées pour vos insights wellness.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Échec de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCalories = () => {
    return foods.reduce((sum, food) => sum + (food.calories || 0), 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmer le Scan</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI Results Banner */}
          <View style={styles.banner}>
            <Ionicons name="sparkles" size={24} color="#4F46E5" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Reconnaissance IA Complète</Text>
              <Text style={styles.bannerSubtitle}>
                Vérifiez et modifiez les résultats si nécessaire
              </Text>
            </View>
          </View>

          {/* Nutrition Summary */}
          {nutrition && (
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionTitle}>Résumé Nutritionnel</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{getTotalCalories()}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.total_weight_g}g</Text>
                  <Text style={styles.nutritionLabel}>Poids</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.meal_type}</Text>
                  <Text style={styles.nutritionLabel}>Type</Text>
                </View>
              </View>
            </View>
          )}

          {/* Detected Foods */}
          <Text style={styles.sectionTitle}>Aliments Détectés</Text>
          {foods.map((food, index) => (
            <View key={index} style={styles.foodCard}>
              <View style={styles.foodHeader}>
                <Text style={styles.foodIndex}>#{index + 1}</Text>
                <TouchableOpacity onPress={() => removeFood(index)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Aliment</Text>
                <TextInput
                  style={styles.input}
                  value={food.item}
                  onChangeText={(text) => updateFood(index, 'item', text)}
                  placeholder="Ex: Pasta"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantité (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(food.qty_g)}
                    onChangeText={(text) => updateFood(index, 'qty_g', text)}
                    keyboardType="numeric"
                    placeholder="150"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Calories</Text>
                  <Text style={styles.caloriesDisplay}>{food.calories || 0}</Text>
                </View>
              </View>

              {food.confidence > 0 && (
                <View style={styles.confidenceBar}>
                  <Text style={styles.confidenceLabel}>Confiance IA:</Text>
                  <View style={styles.confidenceBarOuter}>
                    <View
                      style={[
                        styles.confidenceBarInner,
                        { width: `${food.confidence * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>{Math.round(food.confidence * 100)}%</Text>
                </View>
              )}
            </View>
          ))}

          {/* Add Food Button */}
          <TouchableOpacity style={styles.addButton} onPress={addFood}>
            <Ionicons name="add-circle" size={24} color="#4F46E5" />
            <Text style={styles.addButtonText}>Ajouter un aliment</Text>
          </TouchableOpacity>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Ces données seront utilisées par notre Wellness Brain pour générer vos insights personnalisés
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={confirmScan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirmer et Enregistrer</Text>
                <Ionicons name="checkmark" size={24} color="#fff" />
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#6366F1',
    marginTop: 2,
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  formRow: {
    flexDirection: 'row',
  },
  caloriesDisplay: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    textAlign: 'center',
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  confidenceBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarInner: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
