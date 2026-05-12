import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, 
  Keyboard, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ForgotPasswordProps {
  navigation: any;
}

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSendLink = () => {
    if (email.trim() !== '') {
      setIsSubmitted(true);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />

        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={24} color="#00D1FF" />
        </TouchableOpacity>

        {!isSubmitted ? (
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={40} color="#00D1FF" />
              </View>
              <Text style={styles.title}>Recuperar Senha</Text>
              <Text style={styles.subtitle}>
                Digite o e-mail associado à sua conta. Enviaremos um link para você redefinir sua senha.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu e-mail de acesso"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSendLink} activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Enviar Link</Text>
                <Ionicons name="paper-plane-outline" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.content, styles.successContent]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={48} color="#00E676" />
            </View>
            <Text style={styles.title}>Verifique seu E-mail</Text>
            <Text style={styles.successSubtitle}>
              Mandamos um link de recuperação para o e-mail:{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.spamNote}>
              Por favor, confirme na sua caixa de entrada ou na pasta de spam.
            </Text>

            <TouchableOpacity style={styles.outlineButton} onPress={handleBackToLogin} activeOpacity={0.8}>
              <Text style={styles.outlineButtonText}>Voltar para o Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 24 },
  backButton: { position: 'absolute', top: 60, left: 24, zIndex: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  content: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#002B36', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#00D1FF' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  formContainer: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderWidth: 1, borderColor: '#333', borderRadius: 16, marginBottom: 24, paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  submitButton: { backgroundColor: '#00D1FF', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  successContent: { alignItems: 'center' },
  successIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0, 230, 118, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#00E676' },
  successSubtitle: { fontSize: 16, color: '#AAAAAA', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  emailHighlight: { color: '#FFFFFF', fontWeight: 'bold' },
  spamNote: { fontSize: 13, color: '#666666', textAlign: 'center', marginBottom: 40 },
  outlineButton: { backgroundColor: 'transparent', height: 60, borderRadius: 16, borderWidth: 1, borderColor: '#00D1FF', justifyContent: 'center', alignItems: 'center', width: '100%' },
  outlineButtonText: { color: '#00D1FF', fontSize: 16, fontWeight: 'bold' },
});