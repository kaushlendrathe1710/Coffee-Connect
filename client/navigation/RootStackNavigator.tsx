import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

import AuthStackNavigator from '@/navigation/AuthStackNavigator';
import MainTabNavigator from '@/navigation/MainTabNavigator';
import AdminDashboardScreen from '@/screens/AdminDashboardScreen';
import ChatScreen from '@/screens/ChatScreen';
import DatePlanningScreen from '@/screens/DatePlanningScreen';
import CafeMapScreen from '@/screens/CafeMapScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import FiltersScreen from '@/screens/FiltersScreen';
import WalletScreen from '@/screens/WalletScreen';
import BlockedUsersScreen from '@/screens/BlockedUsersScreen';
import TermsOfServiceScreen from '@/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';
import SafetyPrivacyScreen from '@/screens/SafetyPrivacyScreen';
import HelpSupportScreen from '@/screens/HelpSupportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading, isOnboarded, user } = useAuth();
  const { theme } = useTheme();

  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated || (!isOnboarded && !isAdmin) ? (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ headerShown: false }}
        />
      ) : isAdmin ? (
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerTitle: route.params.matchName,
              headerBackTitle: 'Back',
            })}
          />
          <Stack.Screen
            name="DatePlanning"
            component={DatePlanningScreen}
            options={{
              presentation: 'modal',
              headerTitle: 'Plan a Date',
            }}
          />
          <Stack.Screen
            name="CafeMap"
            component={CafeMapScreen}
            options={{
              presentation: 'modal',
              headerTitle: 'Nearby Cafes',
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              headerTitle: 'Profile',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerTitle: 'Edit Profile',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerTitle: 'Settings',
            }}
          />
          <Stack.Screen
            name="Filters"
            component={FiltersScreen}
            options={{
              presentation: 'modal',
              headerTitle: 'Filters',
            }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              headerTitle: 'My Wallet',
            }}
          />
          <Stack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{
              headerTitle: 'Blocked Users',
            }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              headerTitle: 'Terms of Service',
            }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{
              headerTitle: 'Privacy Policy',
            }}
          />
          <Stack.Screen
            name="SafetyPrivacy"
            component={SafetyPrivacyScreen}
            options={{
              headerTitle: 'Safety & Privacy',
            }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              headerTitle: 'Help & Support',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
