import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Calendar } from 'lucide-react-native';

export default function WeeklyStatsScreen() {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalories: 0,
    averageDaily: 0,
    highestDay: 0,
    daysTracked: 0,
  });

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('daily_calorie_intake')
        .select('*')
        .eq('user_id', user?.id)
        .gte('intake_date', weekAgo.toISOString().split('T')[0])
        .lte('intake_date', today.toISOString().split('T')[0])
        .order('intake_date', { ascending: true });

      if (data && data.length > 0) {
        setWeeklyData(data);

        const totalCalories = data.reduce((sum, d) => sum + (d.total_calories || 0), 0);
        const avgDaily = Math.round(totalCalories / data.length);
        const highestDay = Math.max(...data.map((d) => d.total_calories || 0));

        setStats({
          totalCalories,
          averageDaily: avgDaily,
          highestDay,
          daysTracked: data.length,
        });
      }
    } catch (error) {
      console.error('Error loading weekly data:', error);
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

  const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const maxCalories = Math.max(2500, stats.highestDay * 1.2);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Weekly Calories</Text>
          <Text style={styles.subtitle}>Track your nutrition</Text>
        </View>
        <TrendingUp size={32} color="#10b981" />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCalories}</Text>
          <Text style={styles.statLabel}>Total Calories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.averageDaily}</Text>
          <Text style={styles.statLabel}>Daily Avg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.daysTracked}</Text>
          <Text style={styles.statLabel}>Days Tracked</Text>
        </View>
      </View>

      {weeklyData.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No data yet</Text>
          <Text style={styles.emptyStateText}>
            When you scan menus, your calorie intake will be tracked here
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Calorie Intake</Text>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => {
              const height = (day.total_calories / maxCalories) * 200;
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barLabelContainer}>
                    <Text style={styles.barValue}>{day.total_calories}</Text>
                  </View>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(height, 20), backgroundColor: '#10b981' },
                    ]}
                  />
                  <Text style={styles.barLabel}>{getDayName(day.intake_date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {weeklyData.length > 0 && (
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {weeklyData.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayCardLeft}>
                <Text style={styles.dayDate}>
                  {new Date(day.intake_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.mealsCount}>{day.meals_count} meals</Text>
              </View>
              <View style={styles.dayCardRight}>
                <Text style={styles.dayCalories}>{day.total_calories} kcal</Text>
                {day.notes && (
                  <Text style={styles.dayNotes} numberOfLines={1}>
                    {day.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
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
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 250,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barLabelContainer: {
    minHeight: 24,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 20,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  detailedSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayCardLeft: {
    flex: 1,
  },
  dayCardRight: {
    alignItems: 'flex-end',
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  mealsCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  dayCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  dayNotes: {
    fontSize: 12,
    color: '#9ca3af',
    maxWidth: 150,
  },
});
