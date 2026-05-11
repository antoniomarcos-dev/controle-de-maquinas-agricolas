import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function EndDayScreen({ navigation, route }: any) {
  const { journeyId } = route.params;
  const [lunchBreak, setLunchBreak] = useState('60');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEndDay() {
    Alert.alert('Encerrar Dia', 'Confirma o retorno à garagem e encerramento do dia de trabalho?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: async () => {
        setLoading(true);
        const returnAt = new Date().toISOString();
        const lunch = parseInt(lunchBreak) || 0;

        await supabase.from('journeys').update({
          garage_return_at: returnAt,
          lunch_break_minutes: lunch,
        }).eq('id', journeyId);

        // Close any open services
        await supabase.from('service_orders')
          .update({ status: 'finished', finished_at: returnAt })
          .eq('journey_id', journeyId)
          .eq('status', 'open');

        setLoading(false);
        navigation.replace('Home');
      }},
    ]);
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f0fdf4" />
        </TouchableOpacity>
        <Text style={s.title}>Encerrar Dia</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.icon}>
        <Ionicons name="home" size={48} color="#ca8a04" />
      </View>
      <Text style={s.subtitle}>Retorno à Garagem</Text>
      <Text style={s.desc}>Registre o encerramento do dia de trabalho. Serviços em aberto serão finalizados automaticamente.</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Pausa para Almoço (minutos)</Text>
          <TextInput style={s.input} value={lunchBreak} onChangeText={setLunchBreak}
            keyboardType="numeric" placeholder="60" placeholderTextColor="#5a7a73" />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Observações do Dia (opcional)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes} onChangeText={setNotes} multiline
            placeholder="Alguma observação sobre o dia..." placeholderTextColor="#5a7a73" />
        </View>
      </View>

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.5 }]} onPress={handleEndDay} disabled={loading}>
        <Ionicons name="checkmark-done" size={22} color="#fff" />
        <Text style={s.btnText}>{loading ? 'Encerrando...' : 'Confirmar Retorno'}</Text>
      </TouchableOpacity>

      <Text style={s.time}>
        Horário atual: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', paddingTop: 60, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontSize: 18, fontWeight: '600', color: '#f0fdf4' },
  icon: { alignSelf: 'center', width: 88, height: 88, borderRadius: 22, backgroundColor: 'rgba(202,138,4,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  subtitle: { fontSize: 22, fontWeight: '700', color: '#f0fdf4', textAlign: 'center' },
  desc: { fontSize: 14, color: '#5a7a73', textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 20 },
  form: { gap: 20, marginBottom: 32 },
  field: {},
  label: { fontSize: 13, fontWeight: '500', color: '#b8d4cc', marginBottom: 6 },
  input: { backgroundColor: '#111916', borderWidth: 1, borderColor: '#2d3f3a', borderRadius: 12, padding: 14, color: '#f0fdf4', fontSize: 15 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ca8a04', borderRadius: 14, paddingVertical: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  time: { fontSize: 13, color: '#5a7a73', textAlign: 'center', marginTop: 16, marginBottom: 40 },
});
