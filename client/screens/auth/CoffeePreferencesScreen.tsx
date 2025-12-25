import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, CoffeePreferences } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'CoffeePreferences'>;

export default function CoffeePreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { updateUser } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (item: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Save coffee preferences to AuthContext
    await updateUser({ coffeePreferences: selected });
    navigation.navigate('InterestsSelection');
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
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '40%' }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>What's your coffee style?</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select all that apply. This helps us find better matches.
        </ThemedText>

        <View style={styles.tagsContainer}>
          {CoffeePreferences.map((coffee) => (
            <Pressable
              key={coffee}
              style={({ pressed }) => [
                styles.tag,
                {
                  backgroundColor: selected.includes(coffee) ? theme.primary : theme.backgroundSecondary,
                  borderColor: selected.includes(coffee) ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => toggleSelection(coffee)}
            >
              {selected.includes(coffee) && (
                <Feather name="check" size={16} color={theme.buttonText} />
              )}
              <ThemedText
                style={[
                  styles.tagText,
                  { color: selected.includes(coffee) ? theme.buttonText : theme.text },
                ]}
              >
                {coffee}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl, backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={[styles.selectedCount, { color: theme.textSecondary }]}>
          {selected.length} selected
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: selected.length > 0 ? theme.primary : theme.backgroundTertiary,
              opacity: pressed && selected.length > 0 ? 0.8 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={selected.length === 0}
        >
          <ThemedText
            style={[
              styles.buttonText,
              { color: selected.length > 0 ? theme.buttonText : theme.textSecondary },
            ]}
          >
            Continue
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...Typography.body,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  selectedCount: {
    ...Typography.small,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
