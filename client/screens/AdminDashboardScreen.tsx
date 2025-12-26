import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { apiRequest, getApiUrl } from '@/lib/query-client';

interface PlatformStats {
  totalUsers: number;
  totalHosts: number;
  totalGuests: number;
  totalAdmins: number;
  totalMatches: number;
  totalDates: number;
  totalMessages: number;
  totalRevenue: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  age: string | null;
  role: 'host' | 'guest' | 'admin' | null;
  verified: boolean | null;
  isProtected: boolean | null;
  walletBalance: number | null;
  hostRate: number | null;
  createdAt: string | null;
}

interface AdminMatch {
  id: string;
  user1: { id: string; name: string | null; email: string } | null;
  user2: { id: string; name: string | null; email: string } | null;
  status: string | null;
  createdAt: string | null;
}

interface AdminDate {
  id: string;
  host: { id: string; name: string | null; email: string } | null;
  guest: { id: string; name: string | null; email: string } | null;
  scheduledDate: string;
  cafeName: string | null;
  status: string | null;
  paymentStatus: string | null;
  paymentAmount: number | null;
  createdAt: string | null;
}

interface AdminTransaction {
  id: string;
  user: { id: string; name: string | null; email: string } | null;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description: string | null;
  createdAt: string | null;
}

type TabType = 'stats' | 'users' | 'matches' | 'dates' | 'transactions';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [refreshing, setRefreshing] = useState(false);

  const adminHeaders = { 
    'x-admin-id': user?.id || '',
    'x-admin-email': user?.email || '',
  };

  const { data: statsData, refetch: refetchStats } = useQuery<{ stats: PlatformStats }>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/admin/stats', getApiUrl()).toString(), {
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'admin',
  });

  const { data: usersData, refetch: refetchUsers } = useQuery<{ users: AdminUser[] }>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/admin/users', getApiUrl()).toString(), {
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'admin',
  });

  const { data: matchesData, refetch: refetchMatches } = useQuery<{ matches: AdminMatch[] }>({
    queryKey: ['/api/admin/matches'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/admin/matches', getApiUrl()).toString(), {
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch matches');
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'admin',
  });

  const { data: datesData, refetch: refetchDates } = useQuery<{ dates: AdminDate[] }>({
    queryKey: ['/api/admin/dates'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/admin/dates', getApiUrl()).toString(), {
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch dates');
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'admin',
  });

  const { data: transactionsData, refetch: refetchTransactions } = useQuery<{ transactions: AdminTransaction[] }>({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/admin/transactions', getApiUrl()).toString(), {
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'admin',
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(new URL(`/api/admin/users/${userId}`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const res = await fetch(new URL(`/api/admin/users/${userId}/verify`, getApiUrl()).toString(), {
        method: 'PATCH',
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) throw new Error('Failed to update verification');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchUsers(),
      refetchMatches(),
      refetchDates(),
      refetchTransactions(),
    ]);
    setRefreshing(false);
  }, [refetchStats, refetchUsers, refetchMatches, refetchDates, refetchTransactions]);

  const handleDeleteUser = (userId: string, userName: string | null, isProtected: boolean | null) => {
    if (isProtected) {
      Alert.alert('Protected User', 'This user cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUserMutation.mutate(userId) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const stats = statsData?.stats;
  const users = usersData?.users || [];
  const matchesList = matchesData?.matches || [];
  const datesList = datesData?.dates || [];
  const transactions = transactionsData?.transactions || [];

  const tabs: { key: TabType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: 'stats', label: 'Stats', icon: 'bar-chart-2' },
    { key: 'users', label: 'Users', icon: 'users' },
    { key: 'matches', label: 'Matches', icon: 'heart' },
    { key: 'dates', label: 'Dates', icon: 'calendar' },
    { key: 'transactions', label: 'Pay', icon: 'credit-card' },
  ];

  const renderStats = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="users" size={24} color={theme.primary} />
        <ThemedText style={styles.statValue}>{stats?.totalUsers || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Users</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="coffee" size={24} color="#8B4513" />
        <ThemedText style={styles.statValue}>{stats?.totalHosts || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Hosts</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="search" size={24} color="#4A90D9" />
        <ThemedText style={styles.statValue}>{stats?.totalGuests || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Guests</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="shield" size={24} color="#E74C3C" />
        <ThemedText style={styles.statValue}>{stats?.totalAdmins || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Admins</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="heart" size={24} color="#E91E63" />
        <ThemedText style={styles.statValue}>{stats?.totalMatches || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Matches</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="calendar" size={24} color="#9C27B0" />
        <ThemedText style={styles.statValue}>{stats?.totalDates || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Dates</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="message-circle" size={24} color="#00BCD4" />
        <ThemedText style={styles.statValue}>{stats?.totalMessages || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Messages</ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="dollar-sign" size={24} color="#4CAF50" />
        <ThemedText style={styles.statValue}>{((stats?.totalRevenue || 0) / 100).toFixed(0)}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue (INR)</ThemedText>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.listContainer}>
      {users.map((u) => (
        <View key={u.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.listItemHeader}>
            <View style={styles.listItemInfo}>
              <ThemedText style={styles.listItemTitle}>{u.name || 'No Name'}</ThemedText>
              <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{u.email}</ThemedText>
            </View>
            <View style={styles.listItemBadges}>
              <View style={[styles.roleBadge, { backgroundColor: u.role === 'admin' ? '#E74C3C20' : u.role === 'host' ? '#8B451320' : '#4A90D920' }]}>
                <ThemedText style={[styles.roleBadgeText, { color: u.role === 'admin' ? '#E74C3C' : u.role === 'host' ? '#8B4513' : '#4A90D9' }]}>
                  {u.role || 'No Role'}
                </ThemedText>
              </View>
              {u.isProtected ? (
                <View style={[styles.protectedBadge, { backgroundColor: '#FFD70020' }]}>
                  <Feather name="lock" size={12} color="#FFD700" />
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.listItemDetails}>
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              Wallet: {((u.walletBalance || 0) / 100).toFixed(0)} INR
            </ThemedText>
            {u.role === 'host' && u.hostRate ? (
              <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                Rate: {(u.hostRate / 100).toFixed(0)} INR
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.listItemActions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: u.verified ? '#4CAF5020' : '#FF980020' }]}
              onPress={() => verifyUserMutation.mutate({ userId: u.id, verified: !u.verified })}
            >
              <Feather name={u.verified ? 'check-circle' : 'x-circle'} size={16} color={u.verified ? '#4CAF50' : '#FF9800'} />
              <ThemedText style={[styles.actionButtonText, { color: u.verified ? '#4CAF50' : '#FF9800' }]}>
                {u.verified ? 'Verified' : 'Unverified'}
              </ThemedText>
            </Pressable>
            {!u.isProtected ? (
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#E74C3C20' }]}
                onPress={() => handleDeleteUser(u.id, u.name, u.isProtected)}
              >
                <Feather name="trash-2" size={16} color="#E74C3C" />
                <ThemedText style={[styles.actionButtonText, { color: '#E74C3C' }]}>Delete</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
      {users.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</ThemedText>
      ) : null}
    </View>
  );

  const renderMatches = () => (
    <View style={styles.listContainer}>
      {matchesList.map((match) => (
        <View key={match.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.matchUsers}>
            <View style={styles.matchUser}>
              <ThemedText style={styles.listItemTitle}>{match.user1?.name || 'Unknown'}</ThemedText>
              <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{match.user1?.email}</ThemedText>
            </View>
            <Feather name="heart" size={20} color={theme.primary} style={styles.matchHeart} />
            <View style={styles.matchUser}>
              <ThemedText style={styles.listItemTitle}>{match.user2?.name || 'Unknown'}</ThemedText>
              <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{match.user2?.email}</ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            Matched: {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
      ))}
      {matchesList.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No matches found</ThemedText>
      ) : null}
    </View>
  );

  const renderDates = () => (
    <View style={styles.listContainer}>
      {datesList.map((date) => (
        <View key={date.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.dateHeader}>
            <ThemedText style={styles.listItemTitle}>{date.cafeName || 'No Cafe'}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: date.status === 'confirmed' ? '#4CAF5020' : date.status === 'accepted' ? '#2196F320' : '#FF980020' }]}>
              <ThemedText style={[styles.statusText, { color: date.status === 'confirmed' ? '#4CAF50' : date.status === 'accepted' ? '#2196F3' : '#FF9800' }]}>
                {date.status}
              </ThemedText>
            </View>
          </View>
          <View style={styles.dateParticipants}>
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              Host: {date.host?.name || 'Unknown'}
            </ThemedText>
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              Guest: {date.guest?.name || 'Unknown'}
            </ThemedText>
          </View>
          <View style={styles.dateInfo}>
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {new Date(date.scheduledDate).toLocaleString()}
            </ThemedText>
            {date.paymentAmount ? (
              <ThemedText style={[styles.detailText, { color: date.paymentStatus === 'paid' ? '#4CAF50' : theme.textSecondary }]}>
                {(date.paymentAmount / 100).toFixed(0)} INR ({date.paymentStatus})
              </ThemedText>
            ) : null}
          </View>
        </View>
      ))}
      {datesList.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No dates found</ThemedText>
      ) : null}
    </View>
  );

  const renderTransactions = () => (
    <View style={styles.listContainer}>
      {transactions.map((t) => (
        <View key={t.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.transactionHeader}>
            <View style={styles.transactionInfo}>
              <ThemedText style={styles.listItemTitle}>{t.user?.name || 'Unknown'}</ThemedText>
              <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{t.description || t.source}</ThemedText>
            </View>
            <ThemedText style={[styles.transactionAmount, { color: t.type === 'credit' ? '#4CAF50' : '#E74C3C' }]}>
              {t.type === 'credit' ? '+' : '-'}{(t.amount / 100).toFixed(0)} INR
            </ThemedText>
          </View>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            {t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Unknown'}
          </ThemedText>
        </View>
      ))}
      {transactions.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</ThemedText>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Welcome, {user?.name || 'Admin'}
            </ThemedText>
          </View>
          <Pressable onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: theme.error + '20' }]}>
            <Feather name="log-out" size={20} color={theme.error} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Feather name={tab.icon} size={16} color={activeTab === tab.key ? '#FFF' : theme.text} />
              <ThemedText style={[styles.tabText, activeTab === tab.key && { color: '#FFF' }]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'matches' && renderMatches()}
        {activeTab === 'dates' && renderDates()}
        {activeTab === 'transactions' && renderTransactions()}
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
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    paddingVertical: Spacing.sm,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.md,
    paddingRight: Spacing.xl,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  tabText: {
    ...Typography.small,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.small,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.small,
    textAlign: 'center',
  },
  listContainer: {
    gap: Spacing.md,
  },
  listItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  listItemSubtitle: {
    ...Typography.small,
  },
  listItemBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  protectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  detailText: {
    ...Typography.small,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  actionButtonText: {
    ...Typography.small,
    fontWeight: '600',
  },
  matchUsers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchUser: {
    flex: 1,
  },
  matchHeart: {
    marginHorizontal: Spacing.md,
  },
  dateText: {
    ...Typography.small,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateParticipants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    ...Typography.h4,
    fontWeight: '700',
  },
});
