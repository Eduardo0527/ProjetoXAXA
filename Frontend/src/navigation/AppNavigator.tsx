import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SensorsScreen } from '../screens/SensorsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Sensors') {
              iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },

          tabBarActiveTintColor: '#00D1FF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopWidth: 0,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 0,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Sensors" component={SensorsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}