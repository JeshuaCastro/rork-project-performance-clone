import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Shield, Lock, Eye, FileText, Database } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Data</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Shield size={48} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: June 25, 2025</Text>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Data Collection</Text>
          </View>
          <Text style={styles.paragraph}>
            We collect personal information that you provide to us, including your name, email address, 
            physical characteristics (height, weight, age), and fitness data. We also collect data from 
            connected services like WHOOP when you authorize access.
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>
          <Text style={styles.paragraph}>
            We use your data to provide personalized fitness and nutrition recommendations, 
            analyze your performance trends, and improve our services. Your data helps our AI 
            coach provide tailored advice based on your specific metrics and goals.
          </Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information to third parties. Your data is stored 
            securely and only used to enhance your experience with our app.
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Data Sharing</Text>
          </View>
          <Text style={styles.paragraph}>
            We may share anonymized, aggregated data for research and analytics purposes. 
            We do not share personally identifiable information without your explicit consent, 
            except as required by law.
          </Text>
          <Text style={styles.paragraph}>
            When you connect third-party services like WHOOP, data is exchanged according to 
            their privacy policies and the permissions you grant.
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Your Rights</Text>
          </View>
          <Text style={styles.paragraph}>
            You have the right to access, correct, or delete your personal data. You can also 
            request a copy of your data or withdraw consent for data processing at any time.
          </Text>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact our support team through the Help & Support 
            section of the app.
          </Text>
        </View>
        
        <View style={styles.controlsSection}>
          <Text style={styles.controlsTitle}>Privacy Controls</Text>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlButtonText}>Download My Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlButtonText}>Delete My Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlButtonText}>Manage Connected Services</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.contactText}>
          If you have any questions about our privacy practices, please contact us at privacy@whoopcoach.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isSmallDevice ? 16 : 24,
    paddingBottom: isSmallDevice ? 32 : 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : 24,
  },
  title: {
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: isSmallDevice ? 24 : 32,
  },
  section: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  paragraph: {
    fontSize: isSmallDevice ? 14 : 15,
    lineHeight: isSmallDevice ? 20 : 22,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  controlsSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginTop: 8,
    marginBottom: isSmallDevice ? 20 : 24,
  },
  controlsTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  controlButtonText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.text,
    textAlign: 'center',
  },
  contactText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});