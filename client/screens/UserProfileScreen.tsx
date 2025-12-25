import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<UserProfileRouteProp>();
  const { theme } = useTheme();

  // Mock user data
  const user = {
    name: 'Sarah',
    age: 28,
    bio: 'Coffee addict and book lover. Always looking for the perfect latte spot. Love exploring new cafes and having meaningful conversations.',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    coffeePreferences: ['Latte', 'Cappuccino', 'Oat Milk'],
    interests: ['Reading', 'Travel', 'Yoga', 'Photography'],
    role: 'host',
    verified: true,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoSection}>
          <Image source={{ uri: user.photos[0] }} style={styles.mainPhoto} contentFit="cover" />
          {user.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={14} color={theme.buttonText} />
              <ThemedText style={[styles.verifiedText, { color: theme.buttonText }]}>
                Verified
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.header}>
            <ThemedText style={styles.name}>
              {user.name}, {user.age}
            </ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: theme.secondary }]}>
              <Feather name={user.role === 'host' ? 'coffee' : 'search'} size={14} color={theme.primary} />
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {user.role === 'host' ? 'Host' : 'Guest'}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>{user.bio}</ThemedText>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Coffee Preferences</ThemedText>
            <View style={styles.tagsContainer}>
              {user.coffeePreferences.map((pref) => (
                <View key={pref} style={[styles.tag, { backgroundColor: theme.secondary }]}>
                  <Feather name="coffee" size={12} color={theme.primary} />
                  <ThemedText style={styles.tagText}>{pref}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest) => (
                <View
                  key={interest}
                  style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={styles.tagText}>{interest}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.sm,
  },
  photoSection: {
    position: 'relative',
    marginHorizontal: Spacing.screenPadding,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  mainPhoto: {
    width: '100%',
    aspectRatio: 0.8,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    ...Typography.small,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: Spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    ...Typography.h2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.small,
    fontWeight: '600',
  },
  bio: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.small,
  },
});
