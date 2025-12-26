import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileData {
  id: string;
  name: string;
  age: string;
  bio: string;
  photos: string[];
  coffeePreferences: string[];
  interests: string[];
  availability: { day: string; time: string }[];
  role: 'host' | 'guest';
  verified: boolean;
  rating: number | null;
  ratingCount: number;
  hostRate: number | null;
}

export default function ProfilePreviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ profile: ProfileData }>({
    queryKey: ['/api/users', user?.id, 'preview'],
    enabled: !!user?.id,
  });

  const profile = data?.profile;

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('EditProfile');
  };

  if (isLoading || !profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading preview...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Feather key={i} name="star" size={16} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Feather key={i} name="star" size={16} color="#FFD700" />);
      } else {
        stars.push(<Feather key={i} name="star" size={16} color={theme.textSecondary} />);
      }
    }
    return stars;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.previewBanner, { backgroundColor: theme.primary + '15' }]}>
          <Feather name="eye" size={18} color={theme.primary} />
          <ThemedText style={[styles.previewBannerText, { color: theme.primary }]}>
            This is how others see your profile
          </ThemedText>
        </View>

        {profile.photos && profile.photos.length > 0 ? (
          <Image
            source={{ uri: profile.photos[0] }}
            style={styles.mainPhoto}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.noPhotoPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="camera" size={48} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary }}>No photos yet</ThemedText>
          </View>
        )}

        <View style={styles.profileInfo}>
          <View style={styles.header}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.name}>
                {profile.name}, {profile.age}
              </ThemedText>
              {profile.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={12} color={theme.buttonText} />
                </View>
              )}
            </View>

            <View style={[styles.roleBadge, { backgroundColor: theme.secondary }]}>
              <Feather
                name={profile.role === 'host' ? 'coffee' : 'search'}
                size={14}
                color={theme.primary}
              />
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {profile.role === 'host' ? 'Host' : 'Guest'}
              </ThemedText>
            </View>
          </View>

          {profile.role === 'host' && profile.rating !== null && (
            <View style={styles.ratingRow}>
              <View style={styles.stars}>{renderStars(profile.rating)}</View>
              <ThemedText style={[styles.ratingText, { color: theme.textSecondary }]}>
                {profile.rating.toFixed(1)} ({profile.ratingCount} reviews)
              </ThemedText>
            </View>
          )}

          {profile.role === 'host' && profile.hostRate !== null && (
            <View style={[styles.rateContainer, { backgroundColor: theme.primary + '10' }]}>
              <Feather name="dollar-sign" size={16} color={theme.primary} />
              <ThemedText style={[styles.rateText, { color: theme.primary }]}>
                {(profile.hostRate / 100).toFixed(0)} INR per date
              </ThemedText>
            </View>
          )}

          {profile.bio ? (
            <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
              {profile.bio}
            </ThemedText>
          ) : null}

          {profile.coffeePreferences && profile.coffeePreferences.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Coffee Preferences</ThemedText>
              <View style={styles.tagsContainer}>
                {profile.coffeePreferences.map((pref) => (
                  <View key={pref} style={[styles.tag, { backgroundColor: theme.secondary }]}>
                    <Feather name="coffee" size={12} color={theme.primary} />
                    <ThemedText style={styles.tagText}>{pref}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {profile.interests && profile.interests.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
              <View style={styles.tagsContainer}>
                {profile.interests.map((interest) => (
                  <View
                    key={interest}
                    style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <ThemedText style={styles.tagText}>{interest}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {profile.role === 'host' && profile.availability && profile.availability.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Availability</ThemedText>
              <View style={styles.availabilityContainer}>
                {profile.availability.map((slot, index) => (
                  <View
                    key={index}
                    style={[styles.availabilitySlot, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <ThemedText style={styles.availabilityDay}>{slot.day}</ThemedText>
                    <ThemedText style={[styles.availabilityTime, { color: theme.textSecondary }]}>
                      {slot.time}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleEditProfile}
        >
          <Feather name="edit-2" size={18} color={theme.buttonText} />
          <ThemedText style={[styles.editButtonText, { color: theme.buttonText }]}>
            Edit Profile
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 0,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  previewBannerText: {
    ...Typography.body,
    fontWeight: '600',
  },
  noPhotoPlaceholder: {
    height: SCREEN_WIDTH * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mainPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  profileInfo: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    ...Typography.h2,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    ...Typography.small,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  rateText: {
    ...Typography.body,
    fontWeight: '600',
  },
  bio: {
    ...Typography.body,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.lg,
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
  availabilityContainer: {
    gap: Spacing.sm,
  },
  availabilitySlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  availabilityDay: {
    ...Typography.body,
    fontWeight: '600',
  },
  availabilityTime: {
    ...Typography.body,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.lg,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  editButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
