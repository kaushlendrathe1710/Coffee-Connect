import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, DateData } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MOCK_DATES: DateData[] = [
  {
    id: '1',
    matchId: 'match1',
    matchName: 'Sarah',
    matchPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    cafe: {
      id: 'cafe1',
      name: 'Blue Bottle Coffee',
      address: '123 Main St',
      rating: 4.5,
      latitude: 37.7749,
      longitude: -122.4194,
    },
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    matchId: 'match2',
    matchName: 'Michael',
    matchPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    cafe: {
      id: 'cafe2',
      name: 'Stumptown Coffee',
      address: '456 Oak Ave',
      rating: 4.7,
      latitude: 37.7849,
      longitude: -122.4094,
    },
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    matchId: 'match3',
    matchName: 'Emma',
    matchPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    cafe: {
      id: 'cafe3',
      name: 'Verve Coffee',
      address: '789 Pine Blvd',
      rating: 4.3,
      latitude: 37.7649,
      longitude: -122.4294,
    },
    dateTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [dates] = useState<DateData[]>(MOCK_DATES);

  const upcomingDates = dates.filter(
    (d) => d.status === 'confirmed' || d.status === 'pending'
  );
  const pastDates = dates.filter((d) => d.status === 'completed' || d.status === 'cancelled');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: DateData['status']) => {
    switch (status) {
      case 'confirmed':
        return theme.success;
      case 'pending':
        return theme.warning;
      case 'completed':
        return theme.textSecondary;
      case 'cancelled':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: DateData['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleDatePress = (date: DateData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Chat', {
      matchId: date.matchId,
      matchName: date.matchName,
      matchPhoto: date.matchPhoto,
    });
  };

  const renderDateCard = (date: DateData) => (
    <Pressable
      key={date.id}
      style={({ pressed }) => [
        styles.dateCard,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        Shadows.small,
      ]}
      onPress={() => handleDatePress(date)}
    >
      <Image source={{ uri: date.matchPhoto }} style={styles.dateImage} contentFit="cover" />
      <View style={styles.dateContent}>
        <View style={styles.dateHeader}>
          <ThemedText style={styles.dateName}>{date.matchName}</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(date.status) + '20' }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(date.status) }]}>
              {getStatusLabel(date.status)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.dateDetails}>
          <View style={styles.dateDetail}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.dateDetailText, { color: theme.textSecondary }]}>
              {formatDate(date.dateTime)}
            </ThemedText>
          </View>
          <View style={styles.dateDetail}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.dateDetailText, { color: theme.textSecondary }]}>
              {formatTime(date.dateTime)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cafeInfo}>
          <Feather name="map-pin" size={14} color={theme.primary} />
          <ThemedText style={styles.cafeName} numberOfLines={1}>
            {date.cafe.name}
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  if (dates.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText style={styles.headerTitle}>My Dates</ThemedText>
        </View>
        <View style={styles.emptyState}>
          <Image
            source={require('@assets/images/empty-dates.png')}
            style={styles.emptyImage}
            contentFit="contain"
          />
          <ThemedText style={styles.emptyTitle}>No dates scheduled</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Match with someone and plan your first coffee date!
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.headerTitle}>My Dates</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {upcomingDates.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Upcoming</ThemedText>
            {upcomingDates.map(renderDateCard)}
          </View>
        )}

        {pastDates.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Past Dates</ThemedText>
            {pastDates.map(renderDateCard)}
          </View>
        )}
      </ScrollView>
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
  },
  headerTitle: {
    ...Typography.h2,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  dateImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dateContent: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateName: {
    ...Typography.body,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  dateDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateDetailText: {
    ...Typography.caption,
  },
  cafeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cafeName: {
    ...Typography.small,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
});
