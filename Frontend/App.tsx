import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useRadxaConnection } from './src/services/useRadxaConnection';
import { AuthProvider } from './src/context/AuthContext';
import { usePushNotifications } from './src/services/usePushNotifications'; 

export default function App() {
  useRadxaConnection(); 
  usePushNotifications(); 

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}