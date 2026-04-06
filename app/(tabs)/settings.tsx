import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Settings as SettingsIcon,
  ChevronRight,
  Shield,
  Bell,
  LogOut,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <SettingsIcon size={32} color="#10b981" />
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/edit-profile')}
        >
          <View>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingDescription}>Update your information</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/health-history')}
        >
          <View>
            <Text style={styles.settingLabel}>Health History</Text>
            <Text style={styles.settingDescription}>
              Manage conditions and medications
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/menstrual-tracking')}
        >
          <View>
            <Text style={styles.settingLabel}>Menstrual Cycle Tracking</Text>
            <Text style={styles.settingDescription}>
              Track cycle for personalized nutrition
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>Meal reminders and tips</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={notifications ? '#10b981' : '#f3f4f6'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/privacy-policy')}
        >
          <View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>
              Learn how we protect your data
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>About Nutrilens</Text>
            <Text style={styles.settingDescription}>Version 1.0.0</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9ca3af',
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 24,
  },
});
