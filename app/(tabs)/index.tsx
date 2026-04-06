import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Camera, TrendingUp, Target, Clock, Zap } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: goalsData } = await supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      const { data: scansData } = await supabase
        .from('menu_scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const today = new Date().toISOString().split('T')[0];
      const { data: calorieData } = await supabase
        .from('daily_calorie_intake')
        .select('total_calories')
        .eq('user_id', user?.id)
        .eq('intake_date', today)
        .maybeSingle();

      setProfile(profileData);
      setGoals(goalsData || []);
      setRecentScans(scansData || []);
      setTodayCalories(calorieData?.total_calories || 0);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.full_name || 'there'}!</Text>
          <Text style={styles.subGreeting}>Ready to make healthy choices?</Text>
        </View>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <View>
            <Text style={styles.todayLabel}>Today's Intake</Text>
            <Text style={styles.todayCalories}>{todayCalories}</Text>
            <Text style={styles.todayUnit}>kcal</Text>
          </View>
          <View style={styles.todayIcon}>
            <Zap size={32} color="#fbbf24" />
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min((todayCalories / 2500) * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {todayCalories} / 2500 kcal target
        </Text>
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/(tabs)/scan')}
      >
        <Camera size={24} color="#fff" />
        <Text style={styles.scanButtonText}>Scan Menu</Text>
      </TouchableOpacity>

      {goals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Your Goals</Text>
          </View>
          {goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <Text style={styles.goalType}>
                {goal.goal_type
                  .split('_')
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </Text>
              {goal.target_weight && (
                <Text style={styles.goalTarget}>
                  Target: {goal.target_weight} kg
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{recentScans.length}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.weight || '-'}</Text>
            <Text style={styles.statLabel}>Current Weight (kg)</Text>
          </View>
        </View>
      </View>

      {recentScans.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Recent Scans</Text>
          </View>
          {recentScans.map((scan) => (
            <View key={scan.id} style={styles.scanCard}>
              <View>
                <Text style={styles.scanRestaurant}>
                  {scan.restaurant_name || 'Restaurant'}
                </Text>
                <Text style={styles.scanDate}>
                  {new Date(scan.scan_date).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  scan.processing_status === 'completed' && styles.statusCompleted,
                  scan.processing_status === 'pending' && styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>{scan.processing_status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {recentScans.length === 0 && (
        <View style={styles.emptyState}>
          <Camera size={48} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No scans yet</Text>
          <Text style={styles.emptyStateText}>
            Scan your first restaurant menu to get personalized recommendations
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  todayCard: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 4,
  },
  todayCalories: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  todayUnit: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  todayIcon: {
    backgroundColor: '#fef3c7',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 18,
    borderRadius: 16,
    gap: 12,
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalTarget: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  scanCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanRestaurant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanDate: {
    fontSize: 14,
    color: '#666',
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
});
