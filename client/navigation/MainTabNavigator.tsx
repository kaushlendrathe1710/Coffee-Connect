import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { MainTabParamList } from '@/types/navigation';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

import DiscoverScreen from '@/screens/main/DiscoverScreen';
import MatchesScreen from '@/screens/main/MatchesScreen';
import CalendarScreen from '@/screens/main/CalendarScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DiscoverTab"
      screenOptions={{
        tabBarActiveTintColor: '#6F4E37',
        tabBarInactiveTintColor: '#5A4535',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 16 : 0,
          left: Platform.OS === 'web' ? 16 : 0,
          right: Platform.OS === 'web' ? 16 : 0,
          backgroundColor: '#FAF7F4',
          borderTopWidth: Platform.OS === 'web' ? 0 : 2,
          borderWidth: Platform.OS === 'web' ? 2 : 0,
          borderColor: '#C4B5A5',
          borderRadius: Platform.OS === 'web' ? 20 : 0,
          elevation: 15,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
          paddingTop: Spacing.sm,
          shadowColor: '#2C1810',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FAF7F4' }]} />
        ),
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          color: '#4A3728',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MatchesScreen}
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          title: 'Dates',
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
