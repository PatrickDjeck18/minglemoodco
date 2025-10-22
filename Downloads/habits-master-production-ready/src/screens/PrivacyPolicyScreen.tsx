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

const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect information you provide directly to us, such as when you create an account, 
            use our services, or contact us for support.
          </Text>
          <Text style={styles.bulletPoint}>
            • Account information (name, email address, password)
          </Text>
          <Text style={styles.bulletPoint}>
            • Spiritual journey data (prayer requests, habits, devotions)
          </Text>
          <Text style={styles.bulletPoint}>
            • Usage data (app interactions, preferences, settings)
          </Text>
          <Text style={styles.bulletPoint}>
            • Device information (device type, operating system, app version)
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use the information we collect to provide, maintain, and improve our services:
          </Text>
          <Text style={styles.bulletPoint}>
            • To provide and maintain our spiritual growth services
          </Text>
          <Text style={styles.bulletPoint}>
            • To personalize your experience and content
          </Text>
          <Text style={styles.bulletPoint}>
            • To send you notifications and reminders (with your consent)
          </Text>
          <Text style={styles.bulletPoint}>
            • To improve our app and develop new features
          </Text>
          <Text style={styles.bulletPoint}>
            • To communicate with you about your account and our services
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Information Sharing</Text>
          <Text style={styles.sectionText}>
            We do not sell, trade, or otherwise transfer your personal information to third parties, 
            except in the following circumstances:
          </Text>
          <Text style={styles.bulletPoint}>
            • With your explicit consent
          </Text>
          <Text style={styles.bulletPoint}>
            • To comply with legal obligations
          </Text>
          <Text style={styles.bulletPoint}>
            • To protect our rights and prevent fraud
          </Text>
          <Text style={styles.bulletPoint}>
            • In connection with a business transfer or acquisition
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate security measures to protect your personal information:
          </Text>
          <Text style={styles.bulletPoint}>
            • Encryption of data in transit and at rest
          </Text>
          <Text style={styles.bulletPoint}>
            • Secure authentication and access controls
          </Text>
          <Text style={styles.bulletPoint}>
            • Regular security audits and updates
          </Text>
          <Text style={styles.bulletPoint}>
            • Limited access to personal information on a need-to-know basis
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the following rights regarding your personal information:
          </Text>
          <Text style={styles.bulletPoint}>
            • Access your personal data
          </Text>
          <Text style={styles.bulletPoint}>
            • Correct inaccurate information
          </Text>
          <Text style={styles.bulletPoint}>
            • Delete your account and data
          </Text>
          <Text style={styles.bulletPoint}>
            • Export your data
          </Text>
          <Text style={styles.bulletPoint}>
            • Opt out of certain communications
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our services are not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If we become aware that we have 
            collected personal information from a child under 13, we will take steps to 
            delete such information.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the "Last Updated" 
            date. We encourage you to review this Privacy Policy periodically.
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or our privacy practices, 
            please contact us at:
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

export default PrivacyPolicyScreen;
