import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Erro', 'E-mail ou senha inválidos.');
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <View style={s.logoBox}>
          <Ionicons name="leaf" size={36} color="#fff" />
        </View>
        <Text style={s.title}>Ceres Conecta</Text>
        <Text style={s.subtitle}>Controle Operacional</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>E-mail</Text>
          <TextInput style={s.input} placeholder="operador@empresa.com" placeholderTextColor="#5a7a73"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Senha</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#5a7a73"
              value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#5a7a73" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'rgba(17,25,22,0.9)', borderRadius: 20, padding: 32, borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)' },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#16a34a', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#f0fdf4', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#5a7a73', textAlign: 'center', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: '#b8d4cc', marginBottom: 6 },
  input: { backgroundColor: '#111916', borderWidth: 1, borderColor: '#2d3f3a', borderRadius: 12, padding: 14, color: '#f0fdf4', fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
