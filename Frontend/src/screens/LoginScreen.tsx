import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, 
  Keyboard, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  navigation: any;
  onLogin: () => void;
}

export const LoginScreen = ({ navigation, onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="hardware-chip" size={48} color="#00D1FF" />
          </View>
          <Text style={styles.title}>Rede <Text style={styles.titleHighlight}>Radxa</Text></Text>
          <Text style={styles.subtitle}>Monitoramento Acústico Industrial</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail ou Matrícula"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha de acesso"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Acessar Sistema</Text>
            <Ionicons name="log-in-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Acesso restrito à equipe de manutenção.</Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#002B36', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#00D1FF', shadowColor: '#00D1FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  titleHighlight: { color: '#00D1FF' },
  subtitle: { fontSize: 14, color: '#888888', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1.5 },
  formContainer: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderWidth: 1, borderColor: '#333', borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  eyeIcon: { padding: 8 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 32 },
  forgotPasswordText: { color: '#00D1FF', fontSize: 14, fontWeight: '600' },
  loginButton: { backgroundColor: '#00D1FF', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loginButtonText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  footerText: { color: '#444444', fontSize: 12 },
});