import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = React.useState(false);
  const [rateInput, setRateInput] = React.useState('');

  // Fetch wallet data for guests
  const { data: walletData, refetch: refetchWallet } = useQuery<{ balance: number; transactions: any[] }>({
    queryKey: ['/api/wallet', user?.id],
    enabled: !!user?.id && user?.role === 'guest',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'guest') {
        refetchWallet();
      }
    }, [refetchWallet, user?.role])
  );

  // Update host rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async (newRate: number) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, { hostRate: newRate });
      if (!response.ok) throw new Error('Failed to update rate');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user) {
        updateUser(data.user);
      }
      setEditingRate(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update rate');
    },
  });

  const handleSaveRate = () => {
    const rate = parseInt(rateInput) * 100; // Convert to paise
    if (isNaN(rate) || rate < 100) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate (minimum 1 INR)');
      return;
    }
    updateRateMutation.mutate(rate);
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Settings');
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]);
    } else {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        try {
          await logout();
        } catch (error) {
          console.error('Logout failed:', error);
        }
      }
    }
  };

  const handleProfilePreview = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ProfilePreview');
  };

  const menuItems = [
    { icon: 'edit-2', label: 'Edit Profile', onPress: handleEditProfile },
    { icon: 'eye', label: 'Preview Profile', onPress: handleProfilePreview },
    { icon: 'settings', label: 'Settings', onPress: handleSettings },
    { icon: 'shield', label: 'Safety & Privacy', onPress: () => {} },
    { icon: 'credit-card', label: 'Payment History', onPress: () => {} },
    { icon: 'help-circle', label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.photoContainer}>
            {user?.photos && user.photos.length > 0 ? (
              <Image source={{ uri: user.photos[0] }} style={styles.profilePhoto} contentFit="cover" />
            ) : (
              <View style={[styles.profilePhoto, styles.placeholderPhoto, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="user" size={48} color={theme.textSecondary} />
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.editPhotoButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleEditProfile}
            >
              <Feather name="camera" size={16} color={theme.buttonText} />
            </Pressable>
          </View>

          <ThemedText style={styles.profileName}>
            {user?.name || 'User'}, {user?.age || ''}
          </ThemedText>

          <View style={styles.roleContainer}>
            <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
              <Feather
                name={user?.role === 'host' ? 'coffee' : 'search'}
                size={14}
                color={theme.primary}
              />
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {user?.role === 'host' ? 'Host' : 'Guest'}
              </ThemedText>
            </View>
          </View>

          {user?.bio && (
            <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>{user.bio}</ThemedText>
          )}
        </View>

        {/* Guest Wallet Section */}
        {user?.role === 'guest' && (
          <View style={[styles.walletCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.walletHeader}>
              <Feather name="credit-card" size={20} color={theme.primary} />
              <ThemedText style={styles.walletTitle}>Wallet Balance</ThemedText>
            </View>
            <ThemedText style={[styles.walletBalance, { color: theme.primary }]}>
              {((walletData?.balance || user.walletBalance || 0) / 100).toFixed(0)} INR
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.addFundsButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => navigation.navigate('Wallet' as any)}
            >
              <Feather name="plus" size={16} color={theme.buttonText} />
              <ThemedText style={[styles.addFundsText, { color: theme.buttonText }]}>Add Funds</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Host Rate Section */}
        {user?.role === 'host' && (
          <View style={[styles.rateCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.rateHeader}>
              <View style={styles.rateHeaderLeft}>
                <Feather name="dollar-sign" size={20} color={theme.primary} />
                <ThemedText style={styles.rateTitle}>Your Rate per Date</ThemedText>
              </View>
              {!editingRate && (
                <Pressable
                  onPress={() => {
                    setRateInput(((user.hostRate || 0) / 100).toString());
                    setEditingRate(true);
                  }}
                >
                  <Feather name="edit-2" size={18} color={theme.primary} />
                </Pressable>
              )}
            </View>
            {editingRate ? (
              <View style={styles.rateEditContainer}>
                <View style={styles.rateInputWrapper}>
                  <TextInput
                    style={[styles.rateInput, { color: theme.text, borderColor: theme.border }]}
                    value={rateInput}
                    onChangeText={setRateInput}
                    keyboardType="numeric"
                    placeholder="Enter rate"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <ThemedText style={styles.rateUnit}>INR</ThemedText>
                </View>
                <View style={styles.rateButtons}>
                  <Pressable
                    style={[styles.rateCancelButton, { borderColor: theme.border }]}
                    onPress={() => setEditingRate(false)}
                  >
                    <ThemedText>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.rateSaveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSaveRate}
                    disabled={updateRateMutation.isPending}
                  >
                    <ThemedText style={{ color: theme.buttonText }}>
                      {updateRateMutation.isPending ? 'Saving...' : 'Save'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ThemedText style={[styles.rateValue, { color: theme.primary }]}>
                {user.hostRate ? `${(user.hostRate / 100).toFixed(0)} INR` : 'Not set'}
              </ThemedText>
            )}
            <ThemedText style={[styles.rateHint, { color: theme.textSecondary }]}>
              Guests will be charged this amount when you confirm a date
            </ThemedText>
          </View>
        )}

        {user?.coffeePreferences && user.coffeePreferences.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Coffee Preferences</ThemedText>
            <View style={styles.tagsContainer}>
              {user.coffeePreferences.map((pref) => (
                <View
                  key={pref}
                  style={[styles.tag, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Feather name="coffee" size={12} color={theme.primary} />
                  <ThemedText style={styles.tagText}>{pref}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {user?.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest) => (
                <View
                  key={interest}
                  style={[styles.tag, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                >
                  <ThemedText style={styles.tagText}>{interest}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                {
                  backgroundColor: theme.cardBackground,
                  opacity: pressed ? 0.9 : 1,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.border,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={item.icon as any} size={18} color={theme.text} />
                </View>
                <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: theme.error + '15', opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color={theme.error} />
          <ThemedText style={[styles.logoutText, { color: theme.error }]}>Log Out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  roleContainer: {
    marginBottom: Spacing.sm,
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
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
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
    borderWidth: 1,
  },
  tagText: {
    ...Typography.small,
  },
  menuSection: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    ...Typography.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    ...Typography.body,
    fontWeight: '600',
  },
  walletCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.small,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  walletTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  walletBalance: {
    ...Typography.h1,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  addFundsText: {
    ...Typography.body,
    fontWeight: '600',
  },
  rateCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    ...Shadows.small,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  rateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rateTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  rateValue: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  rateHint: {
    ...Typography.small,
  },
  rateEditContainer: {
    gap: Spacing.md,
  },
  rateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rateInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  rateUnit: {
    ...Typography.body,
    fontWeight: '600',
  },
  rateButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rateCancelButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateSaveButton: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
