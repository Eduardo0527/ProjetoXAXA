import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SensorsScreen } from '../screens/SensorsScreen';

import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0,
          position: 'absolute',
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: '#00D1FF',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Início') iconName = 'home';
          else if (route.name === 'Histórico') iconName = 'list';
          else if (route.name === 'Sensores') iconName = 'radio';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Sensores" component={SensorsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <Stack.Screen name="MainApp" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}