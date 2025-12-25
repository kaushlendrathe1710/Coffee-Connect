import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/types/navigation';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useAuth } from '@/contexts/AuthContext';

import EmailInputScreen from '@/screens/auth/EmailInputScreen';
import OTPVerificationScreen from '@/screens/auth/OTPVerificationScreen';
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import RoleSelectionScreen from '@/screens/auth/RoleSelectionScreen';
import ProfileSetupScreen from '@/screens/auth/ProfileSetupScreen';
import CoffeePreferencesScreen from '@/screens/auth/CoffeePreferencesScreen';
import InterestsSelectionScreen from '@/screens/auth/InterestsSelectionScreen';
import AvailabilitySetupScreen from '@/screens/auth/AvailabilitySetupScreen';
import LocationPermissionScreen from '@/screens/auth/LocationPermissionScreen';
import TermsConsentScreen from '@/screens/auth/TermsConsentScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{
        ...screenOptions,
        headerShown: false,
      }}
      initialRouteName={isAuthenticated ? 'Welcome' : 'EmailInput'}
    >
      <Stack.Screen name="EmailInput" component={EmailInputScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="CoffeePreferences" component={CoffeePreferencesScreen} />
      <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
      <Stack.Screen name="AvailabilitySetup" component={AvailabilitySetupScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="TermsConsent" component={TermsConsentScreen} />
    </Stack.Navigator>
  );
}
