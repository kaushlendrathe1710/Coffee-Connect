import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '@/types/navigation';

import DiscoverScreen from '@/screens/main/DiscoverScreen';
import MatchesScreen from '@/screens/main/MatchesScreen';
import CalendarScreen from '@/screens/main/CalendarScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="DiscoverTab"
      screenOptions={{
        tabBarActiveTintColor: '#3D2817',
        tabBarInactiveTintColor: '#1A0F08',
        tabBarStyle: {
          backgroundColor: '#FFF8F0',
          borderTopWidth: 2,
          borderTopColor: '#6F4E37',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#6F4E37' : '#000000', fontSize: 11, fontWeight: '600' }}>Discover</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Feather name="compass" size={22} color={focused ? '#6F4E37' : '#000000'} />
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MatchesScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#6F4E37' : '#000000', fontSize: 11, fontWeight: '600' }}>Matches</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Feather name="heart" size={22} color={focused ? '#6F4E37' : '#000000'} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#6F4E37' : '#000000', fontSize: 11, fontWeight: '600' }}>Dates</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Feather name="calendar" size={22} color={focused ? '#6F4E37' : '#000000'} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#6F4E37' : '#000000', fontSize: 11, fontWeight: '600' }}>Profile</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={22} color={focused ? '#6F4E37' : '#000000'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
