import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderHeight } from '@react-navigation/elements';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

const TOP_UP_AMOUNTS = [500, 1000, 2000, 5000];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: walletData, isLoading, refetch } = useQuery<{ balance: number; transactions: any[] }>({
    queryKey: ['/api/wallet', user?.id],
    enabled: !!user?.id,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      setIsProcessing(false);
    }, [refetch])
  );

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/wallet/top-up', { 
        userId: user?.id, 
        amount: amount * 100,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment session');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.url) {
        setIsProcessing(true);
        await Linking.openURL(data.url);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to process payment');
    },
  });

  const handleTopUp = (amount: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedAmount(amount);
    topUpMutation.mutate(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <ThemedText style={[styles.balanceLabel, { color: theme.buttonText + '80' }]}>
            Current Balance
          </ThemedText>
          <ThemedText style={[styles.balanceAmount, { color: theme.buttonText }]}>
            {((walletData?.balance || 0) / 100).toFixed(0)} INR
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Add Funds</ThemedText>
          <View style={styles.amountsGrid}>
            {TOP_UP_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={({ pressed }) => [
                  styles.amountCard,
                  { 
                    backgroundColor: selectedAmount === amount ? theme.primary : theme.cardBackground,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleTopUp(amount)}
                disabled={topUpMutation.isPending}
              >
                <ThemedText 
                  style={[
                    styles.amountText, 
                    { color: selectedAmount === amount ? theme.buttonText : theme.text }
                  ]}
                >
                  {amount} INR
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {topUpMutation.isPending && (
            <ThemedText style={[styles.processingText, { color: theme.textSecondary }]}>
              Redirecting to payment...
            </ThemedText>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
          {walletData?.transactions && walletData.transactions.length > 0 ? (
            <View style={[styles.transactionsCard, { backgroundColor: theme.cardBackground }]}>
              {walletData.transactions.map((tx, index) => (
                <View
                  key={tx.id}
                  style={[
                    styles.transactionRow,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: tx.type === 'credit' ? theme.success + '20' : theme.error + '20' }
                    ]}>
                      <Feather 
                        name={tx.type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} 
                        size={16} 
                        color={tx.type === 'credit' ? theme.success : theme.error} 
                      />
                    </View>
                    <View>
                      <ThemedText style={styles.transactionDescription}>
                        {tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Coffee Date')}
                      </ThemedText>
                      <ThemedText style={[styles.transactionDate, { color: theme.textSecondary }]}>
                        {formatDate(tx.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText 
                    style={[
                      styles.transactionAmount,
                      { color: tx.type === 'credit' ? theme.success : theme.error }
                    ]}
                  >
                    {tx.type === 'credit' ? '+' : '-'}{(tx.amount / 100).toFixed(0)} INR
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="credit-card" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions yet
              </ThemedText>
            </View>
          )}
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
    paddingHorizontal: Spacing.screenPadding,
  },
  balanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  balanceLabel: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amountCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.small,
  },
  amountText: {
    ...Typography.h4,
    fontWeight: '600',
  },
  processingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  transactionsCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDescription: {
    ...Typography.body,
    fontWeight: '500',
  },
  transactionDate: {
    ...Typography.small,
  },
  transactionAmount: {
    ...Typography.body,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
  },
});
