import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_building', label: 'Muscle Building' },
  { value: 'health_management', label: 'Health Management' },
  { value: 'maintenance', label: 'Maintenance' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher',
  'Low-Carb',
  'High-Protein',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [bio, setBio] = useState('');

  const [goalType, setGoalType] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const togglePreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName || !age || !weight || !height || !gender) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (step === 2) {
      if (!goalType) {
        setError('Please select a health goal');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleComplete = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: user?.id,
        full_name: fullName,
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activity_level: activityLevel,
        bio,
      });

      if (profileError) throw profileError;

      const { error: goalError } = await supabase.from('health_goals').insert({
        user_id: user?.id,
        goal_type: goalType,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        is_active: true,
      });

      if (goalError) throw goalError;

      if (selectedPreferences.length > 0) {
        const preferences = selectedPreferences.map((pref) => ({
          user_id: user?.id,
          preference_type: pref.toLowerCase().replace('-', '_'),
          is_restriction: false,
        }));

        const { error: prefError } = await supabase
          .from('dietary_preferences')
          .insert(preferences);

        if (prefError) throw prefError;
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
          />
        </View>

        <Text style={styles.stepText}>Step {step} of 3</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              This helps us create personalized recommendations
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.genderRow}>
                  {['male', 'female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderButton,
                        gender === g && styles.genderButtonActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          gender === g && styles.genderButtonTextActive,
                        ]}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Weight (kg) *</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Height (cm) *</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="175"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Activity Level *</Text>
              <View style={styles.optionGrid}>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionButton,
                      activityLevel === level.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setActivityLevel(level.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        activityLevel === level.value &&
                          styles.optionButtonTextActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>About You (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Any additional health information..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>
              We'll tailor recommendations to help you achieve it
            </Text>

            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.goalCard,
                    goalType === goal.value && styles.goalCardActive,
                  ]}
                  onPress={() => setGoalType(goal.value)}
                >
                  <Text
                    style={[
                      styles.goalCardText,
                      goalType === goal.value && styles.goalCardTextActive,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(goalType === 'weight_loss' || goalType === 'muscle_building') && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Target Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  placeholder="65"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Dietary Preferences</Text>
            <Text style={styles.subtitle}>
              Select any that apply to you (optional)
            </Text>

            <View style={styles.preferenceGrid}>
              {DIETARY_PREFERENCES.map((pref) => (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.preferenceChip,
                    selectedPreferences.includes(pref) &&
                      styles.preferenceChipActive,
                  ]}
                  onPress={() => togglePreference(pref)}
                >
                  <Text
                    style={[
                      styles.preferenceChipText,
                      selectedPreferences.includes(pref) &&
                        styles.preferenceChipTextActive,
                    ]}
                  >
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              step === 1 && styles.nextButtonFull,
              loading && styles.buttonDisabled,
            ]}
            onPress={step === 3 ? handleComplete : handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Saving...' : step === 3 ? 'Complete' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  goalGrid: {
    gap: 12,
    marginBottom: 24,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  goalCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  goalCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  goalCardTextActive: {
    color: '#10b981',
  },
  preferenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preferenceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  preferenceChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  preferenceChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  preferenceChipTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
});
