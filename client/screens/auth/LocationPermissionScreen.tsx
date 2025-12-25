import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'LocationPermission'>;

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleRequestPermission = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRequesting(true);

    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await updateUser({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });

        if (user?.role === 'host') {
          navigation.navigate('AvailabilitySetup');
        } else {
          navigation.navigate('TermsConsent');
        }
      } else {
        setDenied(true);
        if (!canAskAgain && Platform.OS !== 'web') {
          // Can't ask again, need to go to settings
        }
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.error('Failed to open settings:', error);
      }
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (user?.role === 'host') {
      navigation.navigate('AvailabilitySetup');
    } else {
      navigation.navigate('TermsConsent');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '70%' }]} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
          <Feather name="map-pin" size={48} color={theme.primary} />
        </View>

        <ThemedText style={styles.title}>Enable Location</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          We need your location to show you nearby matches and cafes for your coffee dates.
        </ThemedText>

        <View style={styles.benefitsList}>
          <BenefitItem icon="compass" text="Find matches near you" />
          <BenefitItem icon="map" text="Discover nearby cafes" />
          <BenefitItem icon="navigation" text="Get accurate distance info" />
        </View>

        {denied && (
          <View style={[styles.deniedBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="alert-circle" size={20} color={theme.warning} />
            <ThemedText style={[styles.deniedText, { color: theme.textSecondary }]}>
              Location access was denied. Please enable it in your device settings.
            </ThemedText>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {denied && Platform.OS !== 'web' ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleOpenSettings}
          >
            <ThemedText style={[styles.buttonText, { color: theme.buttonText }]}>
              Open Settings
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed || isRequesting ? 0.8 : 1 },
            ]}
            onPress={handleRequestPermission}
            disabled={isRequesting}
          >
            <ThemedText style={[styles.buttonText, { color: theme.buttonText }]}>
              {isRequesting ? 'Requesting...' : 'Enable Location'}
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleSkip}
        >
          <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip for now
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function BenefitItem({ icon, text }: { icon: string; text: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.benefitItem}>
      <View style={[styles.benefitIcon, { backgroundColor: theme.secondary }]}>
        <Feather name={icon as any} size={20} color={theme.primary} />
      </View>
      <ThemedText style={styles.benefitText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  benefitsList: {
    width: '100%',
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    ...Typography.body,
  },
  deniedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
  },
  deniedText: {
    flex: 1,
    ...Typography.small,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    ...Typography.body,
  },
});
