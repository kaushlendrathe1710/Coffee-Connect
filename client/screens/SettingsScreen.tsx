import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { apiRequest, getApiUrl } from '@/lib/query-client';

const SETTINGS_STORAGE_KEY = '@coffee_date_settings';

interface UserSettings {
  pushNotifications: boolean;
  messageNotifications: boolean;
  matchNotifications: boolean;
  hideOnlineStatus: boolean;
  showDistance: boolean;
  readReceipts: boolean;
}

const defaultSettings: UserSettings = {
  pushNotifications: true,
  messageNotifications: true,
  matchNotifications: true,
  hideOnlineStatus: false,
  showDistance: true,
  readReceipts: true,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (key: keyof UserSettings) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleBlockedUsers = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('BlockedUsers');
  };

  const handleTermsOfService = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('TermsOfService');
  };

  const handlePrivacyPolicy = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('PrivacyPolicy');
  };

  const handleDeleteAccount = () => {
    const confirmDelete = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch(new URL(`/api/users/${user.id}`, getApiUrl()).toString(), {
          method: 'DELETE',
        });

        if (response.ok) {
          await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
          Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          logout();
        } else {
          const data = await response.json();
          Alert.alert('Error', data.error || 'Failed to delete account');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  type ToggleItem = { icon: string; label: string; type: 'toggle'; key: keyof UserSettings };
  type LinkItem = { icon: string; label: string; type: 'link'; onPress: () => void };
  type SettingItem = ToggleItem | LinkItem;

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', label: 'Push Notifications', type: 'toggle', key: 'pushNotifications' },
        { icon: 'message-circle', label: 'Message Notifications', type: 'toggle', key: 'messageNotifications' },
        { icon: 'heart', label: 'Match Notifications', type: 'toggle', key: 'matchNotifications' },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'eye-off', label: 'Hide Online Status', type: 'toggle', key: 'hideOnlineStatus' },
        { icon: 'map-pin', label: 'Show Distance', type: 'toggle', key: 'showDistance' },
        { icon: 'check-circle', label: 'Read Receipts', type: 'toggle', key: 'readReceipts' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'slash', label: 'Blocked Users', type: 'link', onPress: handleBlockedUsers },
        { icon: 'file-text', label: 'Terms of Service', type: 'link', onPress: handleTermsOfService },
        { icon: 'lock', label: 'Privacy Policy', type: 'link', onPress: handlePrivacyPolicy },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: theme.cardBackground }, Shadows.small]}>
              {section.items.map((item, index) => {
                const isToggle = item.type === 'toggle';
                return (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.settingItem,
                      index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                    ]}
                    onPress={isToggle ? undefined : (item as LinkItem).onPress}
                    disabled={isToggle}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: theme.backgroundSecondary }]}>
                        <Feather name={item.icon as any} size={18} color={theme.text} />
                      </View>
                      <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
                    </View>
                    {isToggle ? (
                      <Switch
                        value={settings[(item as ToggleItem).key]}
                        onValueChange={() => handleToggle((item as ToggleItem).key)}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.dangerSection}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              { backgroundColor: theme.error + '15', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleDeleteAccount}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
            <ThemedText style={[styles.deleteText, { color: theme.error }]}>Delete Account</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          Coffee Date v1.0.0
        </ThemedText>
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
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    ...Typography.body,
  },
  dangerSection: {
    marginTop: Spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  deleteText: {
    ...Typography.body,
    fontWeight: '600',
  },
  version: {
    ...Typography.small,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
});
