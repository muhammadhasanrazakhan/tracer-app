import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConsentScreen from './src/screens/consentScreen';
import TrackingScreen from './src/screens/trackingScreen';
import TripListScreen from './src/screens/tripListScreen';
import TripDetailScreen from './src/screens/tripDetailScreen';

const Stack = createNativeStackNavigator();
const CONSENT_KEY = 'user_consent_v1';

const App = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConsent = async () => {
      const value = await AsyncStorage.getItem(CONSENT_KEY);
      setHasConsent(!!value);
    };
    checkConsent();
  }, []);

  if (hasConsent === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasConsent ? 'TripList' : 'Consent'}
        screenOptions={{
          headerStyle: { backgroundColor: '#0a84ff' },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 20,
          },
          headerShadowVisible: false,
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Consent"
          options={{ headerShown: false }}
        >
          {props => <ConsentScreen {...props} onComplete={() => setHasConsent(true)} />}
        </Stack.Screen>

        <Stack.Screen
          name="TripList"
          component={TripListScreen}
          options={{ title: 'My Trips' }}
        />

        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{ title: 'Track Trip' }}
        />

        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{ title: 'Trip Detail' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;