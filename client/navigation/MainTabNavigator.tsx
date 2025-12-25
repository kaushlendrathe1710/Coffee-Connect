import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { MainTabParamList } from '@/types/navigation';

import DiscoverScreen from '@/screens/main/DiscoverScreen';
import MatchesScreen from '@/screens/main/MatchesScreen';
import CalendarScreen from '@/screens/main/CalendarScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {

  return (
    <Tab.Navigator
      initialRouteName="DiscoverTab"
      screenOptions={{
        tabBarActiveTintColor: '#6F4E37',
        tabBarInactiveTintColor: '#5A4535',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#D4C4B5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
