import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  MessageCircle,
  FileText,
  Youtube,
  RefreshCw,
  Link
} from 'lucide-react-native';

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: "How do I connect my WHOOP account?",
      answer: "Go to the Settings tab and tap 'Connect WHOOP Account'. You'll be redirected to WHOOP's authorization page where you can log in and grant access to your data. Once authorized, your WHOOP data will automatically sync with the app."
    },
    {
      question: "How often does my WHOOP data sync?",
      answer: "Your WHOOP data automatically syncs once per day at midnight. You can also manually sync your data at any time by going to Settings and tapping the refresh button next to your WHOOP connection status."
    },
    {
      question: "Why do I need to complete my profile?",
      answer: "Your profile information (age, weight, height, etc.) is used to calculate personalized nutrition targets and training recommendations. The more complete your profile, the more accurate our AI coach's advice will be."
    },
    {
      question: "How does the AI coach work?",
      answer: "Our AI coach analyzes your WHOOP recovery, strain, and sleep data along with your profile information to provide personalized training and nutrition recommendations. It uses advanced machine learning to understand patterns in your data and provide evidence-based advice."
    },
    {
      question: "Can I use the app without a WHOOP?",
      answer: "Yes, you can use basic features without a WHOOP, but for personalized coaching based on your recovery metrics, connecting a WHOOP device is recommended. Without WHOOP data, the AI coach will provide more general advice based on your profile information."
    },
    {
      question: "How do I track my nutrition?",
      answer: "You can log your meals in the Nutrition tab. The app calculates your daily macro targets based on your profile and fitness goals. You can also ask the AI coach for meal suggestions that align with your targets."
    },
    {
      question: "How do I start a training program?",
      answer: "Go to the Programs tab and select a program type that matches your goals. You can customize the program based on your experience level, available training days, and specific targets. The app will generate a personalized program that adapts to your recovery status."
    },
    {
      question: "What should I do if my recovery is low?",
      answer: "On days with low recovery, the app will automatically adjust your training recommendations. You can also ask the AI coach for specific advice by going to the Coach tab and asking 'What should I do with low recovery today?'"
    }
  ];

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <HelpCircle size={48} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>How can we help?</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.faqItem}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  {expandedFaq === index ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </View>
                
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResultsText}>
              No results found for "{searchQuery}"
            </Text>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => Linking.openURL('mailto:support@whoopcoach.com')}
          >
            <Mail size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDescription}>Get help within 24 hours</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactOption}>
            <MessageCircle size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDescription}>Available 9am-5pm EST</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          
          <TouchableOpacity 
            style={styles.resourceOption}
            onPress={() => Linking.openURL('https://whoopcoach.com/tutorials')}
          >
            <Youtube size={20} color={colors.text} />
            <Text style={styles.resourceText}>Video Tutorials</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resourceOption}
            onPress={() => Linking.openURL('https://whoopcoach.com/guide')}
          >
            <FileText size={20} color={colors.text} />
            <Text style={styles.resourceText}>User Guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resourceOption}
            onPress={() => router.push('/connect-whoop')}
          >
            <Link size={20} color={colors.text} />
            <Text style={styles.resourceText}>WHOOP Connection Help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resourceOption}
            onPress={() => syncWhoopData()}
          >
            <RefreshCw size={20} color={colors.text} />
            <Text style={styles.resourceText}>Sync Troubleshooting</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>App Version 1.0.0</Text>
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
    marginBottom: isSmallDevice ? 16 : 24,
  },
  searchContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: isSmallDevice ? 20 : 24,
  },
  searchInput: {
    height: 48,
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
  },
  section: {
    marginBottom: isSmallDevice ? 24 : 32,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  faqItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: isSmallDevice ? 14 : 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: isSmallDevice ? 13 : 14,
    lineHeight: isSmallDevice ? 18 : 20,
    color: colors.textSecondary,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  noResultsText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: isSmallDevice ? 14 : 16,
    marginBottom: 12,
  },
  contactTextContainer: {
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '500',
    color: colors.text,
  },
  contactDescription: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: isSmallDevice ? 14 : 16,
    marginBottom: 8,
  },
  resourceText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.text,
    marginLeft: 12,
  },
  versionText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});