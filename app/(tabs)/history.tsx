import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { History, ChevronRight, TrendingUp, Award } from 'lucide-react-native';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const { data } = await supabase
        .from('menu_scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setScans(data || []);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (scanId: string) => {
    try {
      const { data } = await supabase
        .from('recommendations')
        .select('*')
        .eq('scan_id', scanId)
        .order('health_score', { ascending: false });

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleScanPress = async (scan: any) => {
    setSelectedScan(scan);
    await loadRecommendations(scan.id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (selectedScan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setSelectedScan(null);
              setRecommendations([]);
            }}
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommendations</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.scanInfo}>
            <Text style={styles.scanInfoTitle}>
              {selectedScan.restaurant_name || 'Restaurant'}
            </Text>
            <Text style={styles.scanInfoDate}>
              {new Date(selectedScan.scan_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {recommendations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recommendations yet</Text>
            </View>
          ) : (
            recommendations.map((rec) => (
              <View key={rec.id} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.dishName}>{rec.dish_name}</Text>
                  <View style={styles.scoreContainer}>
                    <Award size={16} color="#10b981" />
                    <Text style={styles.scoreText}>{rec.health_score}</Text>
                  </View>
                </View>

                <Text style={styles.dishDescription}>{rec.description}</Text>

                <View style={styles.nutritionGrid}>
                  {rec.estimated_calories && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {rec.estimated_calories}
                      </Text>
                      <Text style={styles.nutritionLabel}>cal</Text>
                    </View>
                  )}
                  {rec.protein_g && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{rec.protein_g}g</Text>
                      <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                  )}
                  {rec.carbs_g && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{rec.carbs_g}g</Text>
                      <Text style={styles.nutritionLabel}>carbs</Text>
                    </View>
                  )}
                  {rec.fat_g && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{rec.fat_g}g</Text>
                      <Text style={styles.nutritionLabel}>fat</Text>
                    </View>
                  )}
                </View>

                <View style={styles.reasonContainer}>
                  <TrendingUp size={16} color="#10b981" />
                  <Text style={styles.reasonText}>{rec.recommendation_reason}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerMain}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>Review your past menu scans</Text>
      </View>

      <ScrollView style={styles.content}>
        {scans.length === 0 ? (
          <View style={styles.emptyState}>
            <History size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No scans yet</Text>
            <Text style={styles.emptyStateText}>
              Start by scanning a restaurant menu to get personalized recommendations
            </Text>
          </View>
        ) : (
          scans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.scanCard}
              onPress={() => handleScanPress(scan)}
            >
              <View style={styles.scanCardContent}>
                <View>
                  <Text style={styles.scanCardTitle}>
                    {scan.restaurant_name || 'Restaurant'}
                  </Text>
                  <Text style={styles.scanCardDate}>
                    {new Date(scan.scan_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.scanCardRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      scan.processing_status === 'completed' &&
                        styles.statusCompleted,
                      scan.processing_status === 'pending' && styles.statusPending,
                      scan.processing_status === 'failed' && styles.statusFailed,
                    ]}
                  >
                    <Text style={styles.statusText}>{scan.processing_status}</Text>
                  </View>
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerMain: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  scanCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanCardDate: {
    fontSize: 14,
    color: '#666',
  },
  scanCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scanInfo: {
    backgroundColor: '#fff',
    margin: 24,
    padding: 20,
    borderRadius: 12,
  },
  scanInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanInfoDate: {
    fontSize: 14,
    color: '#666',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dishName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  dishDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  reasonContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});
