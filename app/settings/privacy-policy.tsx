import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.heading}>1. Introduction</Text>
          <Text style={styles.text}>
            Welcome to Nutrilens. We are committed to protecting your privacy and
            ensuring you have a positive experience on our platform. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. Information We Collect</Text>
          <Text style={styles.text}>
            We collect information you provide directly, such as:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>Account information (email, name, password)</Text>
            <Text style={styles.bullet}>Health profile data (age, weight, height, health goals)</Text>
            <Text style={styles.bullet}>Dietary preferences and restrictions</Text>
            <Text style={styles.bullet}>Health history and medical information</Text>
            <Text style={styles.bullet}>Menstrual cycle tracking data</Text>
            <Text style={styles.bullet}>Menu scanning videos and recommendations</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>Provide personalized menu recommendations</Text>
            <Text style={styles.bullet}>Improve our AI analysis and recommendations</Text>
            <Text style={styles.bullet}>Maintain and improve our services</Text>
            <Text style={styles.bullet}>Respond to your inquiries</Text>
            <Text style={styles.bullet}>Ensure security and prevent fraud</Text>
            <Text style={styles.bullet}>Comply with legal obligations</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement comprehensive security measures to protect your personal
            information. All data is encrypted in transit and at rest. Access to
            sensitive information is restricted and monitored.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. AI and Machine Learning</Text>
          <Text style={styles.text}>
            Our application uses artificial intelligence to analyze restaurant
            menus and generate personalized health recommendations. Your data is
            used to improve these AI models while maintaining your privacy. Videos
            and personal health information are processed securely and not shared
            with third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>6. Health Data Privacy</Text>
          <Text style={styles.text}>
            We treat your health information with the highest level of
            confidentiality. Your health history, menstrual cycle data, and other
            sensitive health information are encrypted and accessible only to you
            and our secure AI processing systems.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>7. Sharing Your Information</Text>
          <Text style={styles.text}>
            We do not sell, trade, or rent your personal information to third
            parties. We may share information only when:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>Required by law or legal process</Text>
            <Text style={styles.bullet}>Necessary for service providers (hosting, analytics)</Text>
            <Text style={styles.bullet}>With your explicit consent</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>8. Your Rights</Text>
          <Text style={styles.text}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>Access your personal information</Text>
            <Text style={styles.bullet}>Request correction of inaccurate data</Text>
            <Text style={styles.bullet}>Request deletion of your data</Text>
            <Text style={styles.bullet}>Opt-out of data processing</Text>
            <Text style={styles.bullet}>Export your data</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>9. Cookies and Tracking</Text>
          <Text style={styles.text}>
            Our application may use cookies or similar tracking technologies to
            enhance user experience and analyze usage patterns. You can control
            these settings through your device preferences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>10. Children's Privacy</Text>
          <Text style={styles.text}>
            Nutrilens is not intended for children under 13 years old. We do not
            knowingly collect information from children. If we become aware of such
            collection, we will delete it immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>11. Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy periodically. We will notify you of
            significant changes via email or through the application. Your continued
            use of Nutrilens constitutes acceptance of these changes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>12. Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us at:
          </Text>
          <Text style={styles.text}>
            Email: privacy@nutrilens.com{'\n'}
            Address: Nutrilens Support Team
          </Text>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last Updated: April 2026
          </Text>
        </View>
      </ScrollView>
    </View>
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
  section: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 12,
    lineHeight: 24,
  },
  text: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 12,
    marginTop: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  lastUpdated: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
