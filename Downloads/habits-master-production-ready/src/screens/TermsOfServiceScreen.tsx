import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';

const TermsOfServiceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 10,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 16,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    sectionText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    bulletPoint: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginLeft: 16,
      marginBottom: 8,
    },
    lastUpdated: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using FaithHabits, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Description of Service</Text>
          <Text style={styles.sectionText}>
            FaithHabits is a spiritual growth application designed to help users develop 
            and maintain Christian habits, track prayer requests, engage with daily devotions, 
            and build a stronger relationship with God.
          </Text>
          <Text style={styles.bulletPoint}>
            • Prayer request sharing and tracking
          </Text>
          <Text style={styles.bulletPoint}>
            • Daily Bible verse and devotion content
          </Text>
          <Text style={styles.bulletPoint}>
            • Habit tracking and spiritual milestones
          </Text>
          <Text style={styles.bulletPoint}>
            • Community features and support
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>User Accounts</Text>
          <Text style={styles.sectionText}>
            To access certain features of our service, you must create an account. You agree to:
          </Text>
          <Text style={styles.bulletPoint}>
            • Provide accurate and complete information
          </Text>
          <Text style={styles.bulletPoint}>
            • Maintain the security of your password
          </Text>
          <Text style={styles.bulletPoint}>
            • Accept responsibility for all activities under your account
          </Text>
          <Text style={styles.bulletPoint}>
            • Notify us immediately of any unauthorized use
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptable Use</Text>
          <Text style={styles.sectionText}>
            You agree to use our service only for lawful purposes and in accordance with these terms. 
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>
            • Use the service for any unlawful purpose or to solicit others to perform unlawful acts
          </Text>
          <Text style={styles.bulletPoint}>
            • Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
          </Text>
          <Text style={styles.bulletPoint}>
            • Infringe upon or violate our intellectual property rights or the intellectual property rights of others
          </Text>
          <Text style={styles.bulletPoint}>
            • Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
          </Text>
          <Text style={styles.bulletPoint}>
            • Submit false or misleading information
          </Text>
          <Text style={styles.bulletPoint}>
            • Upload or transmit viruses or any other type of malicious code
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Spiritual Content</Text>
          <Text style={styles.sectionText}>
            Our service provides spiritual content including Bible verses, devotions, and prayer 
            guidance. This content is provided for spiritual growth and should not replace:
          </Text>
          <Text style={styles.bulletPoint}>
            • Personal Bible study and prayer
          </Text>
          <Text style={styles.bulletPoint}>
            • Fellowship with your local church community
          </Text>
          <Text style={styles.bulletPoint}>
            • Professional spiritual counseling when needed
          </Text>
          <Text style={styles.bulletPoint}>
            • Medical or mental health treatment
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy and Data</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. Please review our Privacy Policy, which also 
            governs your use of the service, to understand our practices. By using our service, 
            you consent to the collection and use of information in accordance with our Privacy Policy.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The service and its original content, features, and functionality are and will remain 
            the exclusive property of FaithHabits and its licensors. The service is protected by 
            copyright, trademark, and other laws.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.sectionText}>
            We may terminate or suspend your account and bar access to the service immediately, 
            without prior notice or liability, under our sole discretion, for any reason whatsoever 
            and without limitation, including but not limited to a breach of the Terms.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={styles.sectionText}>
            The information on this service is provided on an "as is" basis. To the fullest extent 
            permitted by law, FaithHabits excludes all representations, warranties, conditions 
            and terms relating to our service and the use of this service.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            In no event shall FaithHabits, nor its directors, employees, partners, agents, 
            suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, 
            or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from your use of the service.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law</Text>
          <Text style={styles.sectionText}>
            These Terms shall be interpreted and governed by the laws of the United States, 
            without regard to its conflict of law provisions. Our failure to enforce any right 
            or provision of these Terms will not be considered a waiver of those rights.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at 
            any time. If a revision is material, we will provide at least 30 days notice prior 
            to any new terms taking effect.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.bulletPoint}>
            📧 Email: support@dailyfaith.com
          </Text>
          <Text style={styles.bulletPoint}>
            🌐 Website: www.dailyfaith.me
          </Text>
          <Text style={styles.bulletPoint}>
            📞 Phone: +13239168235
          </Text>
        </GlassCard>

        <Text style={styles.lastUpdated}>
          Last Updated: {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsOfServiceScreen;
