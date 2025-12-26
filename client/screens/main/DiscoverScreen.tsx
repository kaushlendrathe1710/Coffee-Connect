import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions, Animated, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows, Colors } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.screenPadding * 2;

interface Profile {
  id: string;
  name: string;
  age: string;
  bio: string;
  photos: string[];
  coffeePreferences: string[];
  interests: string[];
  role: 'host' | 'guest';
  verified: boolean;
  location: { latitude: number; longitude: number } | null;
}

interface MatchResult {
  id: string;
  matchedUser: {
    id: string;
    name: string;
    photos: string[];
  };
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo: string } | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const matchScale = useRef(new Animated.Value(0)).current;

  // Fetch discoverable profiles
  const { data: profilesData, isLoading, refetch } = useQuery<{ profiles: Profile[] }>({
    queryKey: ['/api/discover', user?.id],
    enabled: !!user?.id && !!user?.role,
  });

  const profiles = profilesData?.profiles || [];
  const currentProfile = profiles[currentIndex];

  // Swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async ({ swipedId, direction }: { swipedId: string; direction: 'like' | 'pass' }) => {
      const res = await apiRequest('POST', '/api/swipe', {
        swiperId: user?.id,
        swipedId,
        direction,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.isMatch && data.match?.matchedUser) {
        // Show match celebration
        setMatchedUser({
          name: data.match.matchedUser.name,
          photo: data.match.matchedUser.photos?.[0] || '',
        });
        setShowMatchModal(true);
        
        // Animate modal
        Animated.spring(matchScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Invalidate matches cache
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      }
    },
  });

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentProfile) return;

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
      
      // Record swipe
      swipeMutation.mutate({
        swipedId: currentProfile.id,
        direction: direction === 'right' ? 'like' : 'pass',
      });

      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Refetch when we run out of profiles
        setCurrentIndex(0);
        refetch();
      }
    });
  }, [currentProfile, profiles.length, translateX, swipeMutation, currentIndex, refetch]);

  const handleLike = () => handleSwipe('right');
  const handlePass = () => handleSwipe('left');

  const handleCloseMatch = () => {
    matchScale.setValue(0);
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const handleSendMessage = () => {
    handleCloseMatch();
    // Navigate to matches tab
    navigation.navigate('Main', { screen: 'MatchesTab' });
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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingState, { paddingTop: insets.top + Spacing['3xl'] }]}>
          <ThemedText style={styles.loadingText}>Finding your matches...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!currentProfile || profiles.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: insets.top + Spacing['3xl'] }]}>
          <AnimatedEmptyState
            icon="coffee"
            title="No more profiles"
            subtitle="Check back later for new coffee dates!"
            action={
              <Pressable
                style={[styles.refreshButton, { backgroundColor: theme.primary }]}
                onPress={() => refetch()}
              >
                <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                <ThemedText style={styles.refreshText}>Refresh</ThemedText>
              </Pressable>
            }
          />
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
                <ThemedText style={[styles.stampText, { color: Colors.light.success }]}>LIKE</ThemedText>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <ThemedText style={[styles.stampText, { color: Colors.light.error }]}>NOPE</ThemedText>
              </Animated.View>
            </View>
            <View style={[styles.cardInfo, Platform.OS === 'ios' ? {} : { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <ThemedText style={[styles.cardName, { color: '#FFFFFF' }]}>
                      {currentProfile.name}, {currentProfile.age}
                    </ThemedText>
                    {currentProfile.verified ? (
                      <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: currentProfile.role === 'host' ? Colors.light.primary : theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.roleText, { color: '#FFFFFF' }]}>
                      {currentProfile.role === 'host' ? 'Host' : 'Guest'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.cardBio, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
                  {currentProfile.bio}
                </ThemedText>
                <View style={styles.tagsRow}>
                  {currentProfile.coffeePreferences?.slice(0, 3).map((pref) => (
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

      {/* Match Celebration Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMatch}
      >
        <View style={styles.modalOverlay}>
          <ConfettiEffect isActive={showMatchModal} />
          <Animated.View 
            style={[
              styles.matchModal, 
              { backgroundColor: theme.backgroundDefault, transform: [{ scale: matchScale }] }
            ]}
          >
            <View style={styles.matchContent}>
              <ThemedText style={[styles.matchTitle, { color: theme.primary }]}>
                It's a Match!
              </ThemedText>
              <ThemedText style={[styles.matchSubtitle, { color: theme.textSecondary }]}>
                You and {matchedUser?.name} liked each other
              </ThemedText>
              
              <View style={styles.matchPhotos}>
                <View style={[styles.matchPhotoContainer, Shadows.medium]}>
                  <Image
                    source={{ uri: user?.photos?.[0] || 'https://via.placeholder.com/100' }}
                    style={styles.matchPhoto}
                    contentFit="cover"
                  />
                </View>
                <View style={[styles.matchHeart, { backgroundColor: theme.primary }]}>
                  <Feather name="heart" size={24} color="#FFFFFF" />
                </View>
                <View style={[styles.matchPhotoContainer, Shadows.medium]}>
                  <Image
                    source={{ uri: matchedUser?.photo || 'https://via.placeholder.com/100' }}
                    style={styles.matchPhoto}
                    contentFit="cover"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.sendMessageButton, { backgroundColor: theme.primary }]}
                onPress={handleSendMessage}
              >
                <Feather name="message-circle" size={20} color="#FFFFFF" />
                <ThemedText style={styles.sendMessageText}>Send a Message</ThemedText>
              </Pressable>

              <Pressable
                style={styles.keepSwipingButton}
                onPress={handleCloseMatch}
              >
                <ThemedText style={[styles.keepSwipingText, { color: theme.textSecondary }]}>
                  Keep Swiping
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  card: {
    width: CARD_WIDTH,
    height: SCREEN_HEIGHT * 0.58,
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
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardName: {
    ...Typography.h3,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '600',
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  refreshText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    width: SCREEN_WIDTH - Spacing.screenPadding * 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  matchContent: {
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  matchSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  matchPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  matchPhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  matchPhoto: {
    width: '100%',
    height: '100%',
  },
  matchHeart: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -Spacing.md,
    zIndex: 1,
  },
  sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  sendMessageText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  keepSwipingButton: {
    paddingVertical: Spacing.md,
  },
  keepSwipingText: {
    ...Typography.body,
  },
});
