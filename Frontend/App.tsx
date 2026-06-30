import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useRadxaConnection } from './src/hooks/useRadxaConnection';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  useRadxaConnection();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}