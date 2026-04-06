import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  User,
  Target,
  Heart,
  LogOut,
  ChevronRight,
  Mail,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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

      const { data: prefsData } = await supabase
        .from('dietary_preferences')
        .select('*')
        .eq('user_id', user?.id);

      setProfile(profileData);
      setGoals(goalsData || []);
      setPreferences(prefsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
        <View style={styles.avatarContainer}>
          <User size={32} color="#10b981" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <View style={styles.emailContainer}>
          <Mail size={14} color="#666" />
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{profile?.age || '-'} years</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{profile?.weight || '-'} kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{profile?.height || '-'} cm</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {profile?.gender
                ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                : '-'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Activity Level</Text>
            <Text style={styles.infoValue}>
              {profile?.activity_level
                ? profile.activity_level
                    .split('_')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
                : '-'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Health Goals</Text>
        </View>
        {goals.length === 0 ? (
          <Text style={styles.emptyText}>No active goals</Text>
        ) : (
          goals.map((goal) => (
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
              {goal.target_date && (
                <Text style={styles.goalDate}>
                  By: {new Date(goal.target_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Heart size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        </View>
        {preferences.length === 0 ? (
          <Text style={styles.emptyText}>No dietary preferences set</Text>
        ) : (
          <View style={styles.preferenceGrid}>
            {preferences.map((pref) => (
              <View key={pref.id} style={styles.preferenceChip}>
                <Text style={styles.preferenceText}>
                  {pref.preference_type
                    .split('_')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {profile?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Member since {new Date(profile?.created_at).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 24,
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
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
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
    marginBottom: 2,
  },
  goalDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  preferenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  bioCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
