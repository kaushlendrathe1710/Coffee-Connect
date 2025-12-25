import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('RoleSelection');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing['3xl'] }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <ThemedText style={styles.title}>Coffee Date</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Find your perfect coffee companion
        </ThemedText>

        <View style={styles.illustrationContainer}>
          <Image
            source={require('@assets/images/welcome-illustration.png')}
            style={styles.illustration}
            contentFit="contain"
          />
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="compass"
            title="Discover"
            description="Find people nearby who share your coffee passion"
          />
          <FeatureItem
            icon="heart"
            title="Match"
            description="Connect with those who catch your interest"
          />
          <FeatureItem
            icon="coffee"
            title="Meet"
            description="Plan coffee dates at amazing local cafes"
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleGetStarted}
        >
          <ThemedText style={[styles.buttonText, { color: theme.buttonText }]}>
            Get Started
          </ThemedText>
          <Feather name="arrow-right" size={20} color={theme.buttonText} />
        </Pressable>
      </View>
    </ThemedView>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.secondary }]}>
        <Feather name={icon as any} size={24} color={theme.primary} />
      </View>
      <View style={styles.featureText}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  illustration: {
    width: '100%',
    height: 180,
  },
  features: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h4,
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.small,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
