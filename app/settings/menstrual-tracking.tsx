import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Plus, Calendar, X } from 'lucide-react-native';

const FLOW_INTENSITIES = ['spotting', 'light', 'moderate', 'heavy'];
const SYMPTOMS = [
  'Cramps',
  'Bloating',
  'Headache',
  'Fatigue',
  'Mood Swings',
  'Breast Tenderness',
];

export default function MenstrualTrackingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cycleDate, setCycleDate] = useState(new Date().toISOString().split('T')[0]);
  const [flowIntensity, setFlowIntensity] = useState('moderate');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      const { data } = await supabase
        .from('menstrual_cycle')
        .select('*')
        .eq('user_id', user?.id)
        .order('cycle_date', { ascending: false })
        .limit(12);

      setCycles(data || []);
    } catch (error) {
      console.error('Error loading cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCycle = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('menstrual_cycle').insert({
        user_id: user?.id,
        cycle_date: cycleDate,
        flow_intensity: flowIntensity,
        symptoms: selectedSymptoms,
      });

      if (error) throw error;

      setCycleDate(new Date().toISOString().split('T')[0]);
      setFlowIntensity('moderate');
      setSelectedSymptoms([]);
      setShowModal(false);
      await loadCycles();
    } catch (error) {
      console.error('Error adding cycle:', error);
    } finally {
      setSaving(false);
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
        <Text style={styles.title}>Cycle Tracking</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Plus size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {cycles.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No cycle data yet</Text>
            <Text style={styles.emptyStateText}>
              Track your menstrual cycle to get personalized nutrition recommendations
            </Text>
          </View>
        ) : (
          cycles.map((cycle, index) => (
            <View key={cycle.id} style={styles.cycleCard}>
              <View style={styles.cycleDate}>
                <Calendar size={20} color="#10b981" />
                <Text style={styles.cycleDateText}>
                  {new Date(cycle.cycle_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.cycleInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Flow</Text>
                  <View style={styles.flowBadge}>
                    <Text style={styles.flowText}>
                      {cycle.flow_intensity.charAt(0).toUpperCase() +
                        cycle.flow_intensity.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {cycle.symptoms && cycle.symptoms.length > 0 && (
                <View style={styles.symptomsContainer}>
                  <Text style={styles.symptomsLabel}>Symptoms</Text>
                  <View style={styles.symptomsGrid}>
                    {cycle.symptoms.map((symptom: string) => (
                      <View key={symptom} style={styles.symptomTag}>
                        <Text style={styles.symptomText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Cycle Entry</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TouchableOpacity style={styles.dateInput}>
                  <Calendar size={20} color="#10b981" />
                  <Text style={styles.dateInputText}>{cycleDate}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Flow Intensity</Text>
                <View style={styles.intensityGrid}>
                  {FLOW_INTENSITIES.map((intensity) => (
                    <TouchableOpacity
                      key={intensity}
                      style={[
                        styles.intensityButton,
                        flowIntensity === intensity && styles.intensityButtonActive,
                      ]}
                      onPress={() => setFlowIntensity(intensity)}
                    >
                      <Text
                        style={[
                          styles.intensityButtonText,
                          flowIntensity === intensity &&
                            styles.intensityButtonTextActive,
                        ]}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Symptoms (Optional)</Text>
                <View style={styles.symptomsCheckGrid}>
                  {SYMPTOMS.map((symptom) => (
                    <TouchableOpacity
                      key={symptom}
                      style={[
                        styles.symptomCheckButton,
                        selectedSymptoms.includes(symptom) &&
                          styles.symptomCheckButtonActive,
                      ]}
                      onPress={() => toggleSymptom(symptom)}
                    >
                      <Text
                        style={[
                          styles.symptomCheckText,
                          selectedSymptoms.includes(symptom) &&
                            styles.symptomCheckTextActive,
                        ]}
                      >
                        {symptom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, saving && styles.buttonDisabled]}
                onPress={handleAddCycle}
                disabled={saving}
              >
                <Text style={styles.addButtonText}>
                  {saving ? 'Logging...' : 'Log Entry'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cycleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cycleDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cycleDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cycleInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  flowBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  flowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  symptomsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '500',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  symptomText: {
    fontSize: 12,
    color: '#166534',
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
    maxHeight: '90%',
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
  dateInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  intensityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  intensityButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  intensityButtonTextActive: {
    color: '#fff',
  },
  symptomsCheckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomCheckButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  symptomCheckButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  symptomCheckText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  symptomCheckTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
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
