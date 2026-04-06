import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react-native';

const HISTORY_TYPES = [
  'condition',
  'medication',
  'surgery',
  'allergy',
  'supplement',
  'other',
];

export default function HealthHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('condition');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('health_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setHistoryItems(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistory = async () => {
    if (!description) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('health_history').insert({
        user_id: user?.id,
        history_type: selectedType,
        description,
        date_recorded: new Date().toISOString().split('T')[0],
        is_active: true,
      });

      if (error) throw error;

      setDescription('');
      setSelectedType('condition');
      setShowModal(false);
      await loadHistory();
    } catch (error) {
      console.error('Error adding history:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('health_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadHistory();
    } catch (error) {
      console.error('Error deleting history:', error);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Health History</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Plus size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {historyItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No health history yet</Text>
            <Text style={styles.emptyStateText}>
              Add your health conditions, medications, and other important
              information to help personalize recommendations
            </Text>
          </View>
        ) : (
          historyItems.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.historyType}>
                    {item.history_type.charAt(0).toUpperCase() +
                      item.history_type.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteHistory(item.id)}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.historyDescription}>{item.description}</Text>
              {item.date_recorded && (
                <Text style={styles.historyDate}>
                  {new Date(item.date_recorded).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Health Item</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeGrid}>
                  {HISTORY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        selectedType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter details..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.addButton, saving && styles.buttonDisabled]}
                onPress={handleAddHistory}
                disabled={saving}
              >
                <Text style={styles.addButtonText}>
                  {saving ? 'Adding...' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyDescription: {
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  historyDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
});
