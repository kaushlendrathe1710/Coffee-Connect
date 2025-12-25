import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.screenPadding * 2;

const MOCK_PROFILES = [
  {
    id: '1',
    name: 'Sarah',
    age: 28,
    bio: 'Coffee addict and book lover. Always looking for the perfect latte spot.',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    coffeePreferences: ['Latte', 'Cappuccino'],
    interests: ['Reading', 'Travel', 'Yoga'],
    distance: 2.3,
    role: 'host',
  },
  {
    id: '2',
    name: 'Michael',
    age: 32,
    bio: 'Entrepreneur by day, coffee enthusiast by all hours. Let\'s chat over espresso!',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    coffeePreferences: ['Espresso', 'Cold Brew'],
    interests: ['Tech', 'Fitness', 'Music'],
    distance: 1.5,
    role: 'host',
  },
  {
    id: '3',
    name: 'Emma',
    age: 26,
    bio: 'Photographer and matcha lover. Always seeking new perspectives and great company.',
    photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
    coffeePreferences: ['Matcha', 'Iced Coffee'],
    interests: ['Photography', 'Art', 'Hiking'],
    distance: 3.8,
    role: 'host',
  },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles] = useState(MOCK_PROFILES);
  const translateX = useRef(new Animated.Value(0)).current;

  const currentProfile = profiles[currentIndex];

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        direction === 'right'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }

    Animated.spring(translateX, {
      toValue: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
      useNativeDriver: true,
      friction: 5,
    }).start(() => {
      translateX.setValue(0);
      if (direction === 'right') {
        // It's a match for demo
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
    });
  }, [profiles.length, translateX]);

  const handleLike = () => handleSwipe('right');
  const handlePass = () => handleSwipe('left');

  const handleFilters = () => {
    navigation.navigate('Filters');
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.setValue(event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX > 100) {
        runOnJS(handleSwipe)('right');
      } else if (event.translationX < -100) {
        runOnJS(handleSwipe)('left');
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const likeOpacity = translateX.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (!currentProfile) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: insets.top + Spacing['3xl'] }]}>
          <Image
            source={require('@assets/images/empty-matches.png')}
            style={styles.emptyImage}
            contentFit="contain"
          />
          <ThemedText style={styles.emptyTitle}>No more profiles</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Check back later for new matches
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerLogo}>
          <Image
            source={require('@assets/images/icon.png')}
            style={styles.logoIcon}
            contentFit="contain"
          />
          <ThemedText style={styles.logoText}>Coffee Date</ThemedText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleFilters}
        >
          <Feather name="sliders" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.cardContainer}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, transform: [{ translateX }, { rotate }] },
              Shadows.large,
            ]}
          >
            <Image
              source={{ uri: currentProfile.photos[0] }}
              style={styles.cardImage}
              contentFit="cover"
            />
            <View style={styles.cardOverlay}>
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <ThemedText style={[styles.stampText, { color: theme.success }]}>LIKE</ThemedText>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <ThemedText style={[styles.stampText, { color: theme.error }]}>NOPE</ThemedText>
              </Animated.View>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <ThemedText style={[styles.cardName, { color: '#FFFFFF' }]}>
                  {currentProfile.name}, {currentProfile.age}
                </ThemedText>
                <View style={[styles.distanceBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Feather name="map-pin" size={12} color="#FFFFFF" />
                  <ThemedText style={[styles.distanceText, { color: '#FFFFFF' }]}>
                    {currentProfile.distance} km
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.cardBio, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
                {currentProfile.bio}
              </ThemedText>
              <View style={styles.tagsRow}>
                {currentProfile.coffeePreferences.slice(0, 3).map((pref) => (
                  <View
                    key={pref}
                    style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  >
                    <Feather name="coffee" size={12} color="#FFFFFF" />
                    <ThemedText style={[styles.tagText, { color: '#FFFFFF' }]}>{pref}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 100 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.passButton,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
            Shadows.medium,
          ]}
          onPress={handlePass}
        >
          <Feather name="x" size={28} color={theme.error} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.likeButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            Shadows.medium,
          ]}
          onPress={handleLike}
        >
          <Feather name="heart" size={28} color="#FFFFFF" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
  },
  logoText: {
    ...Typography.h3,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  card: {
    width: CARD_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    padding: Spacing.md,
    borderWidth: 4,
    borderRadius: BorderRadius.sm,
  },
  likeStamp: {
    right: 20,
    borderColor: '#8BC34A',
    transform: [{ rotate: '15deg' }],
  },
  nopeStamp: {
    left: 20,
    borderColor: '#E57373',
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: '800',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardName: {
    ...Typography.h3,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  distanceText: {
    ...Typography.caption,
  },
  cardBio: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {},
  likeButton: {},
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
