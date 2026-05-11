import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Ionicons } from '@expo/vector-icons';

export default function StartServiceScreen({ navigation, route }: any) {
  const { journeyId, equipmentType, equipmentId, equipmentName } = route.params;
  const { profile } = useAuth();
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [hourmeter, setHourmeter] = useState('');
  const [mileage, setMileage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!profile) return;
    setLoading(true);
    const payload: any = {
      operator_id: profile.id,
      journey_id: journeyId,
      date: new Date().toISOString().split('T')[0],
      location: location || null,
      notes: notes || null,
    };
    if (equipmentType === 'machine') {
      payload.machine_id = equipmentId;
      payload.hourmeter_initial = hourmeter ? parseFloat(hourmeter) : null;
    } else {
      payload.vehicle_id = equipmentId;
      payload.mileage_initial = mileage ? parseFloat(mileage) : null;
    }

    const { data, error } = await supabase.from('service_orders').insert(payload).select().single();
    setLoading(false);
    if (error) { Alert.alert('Erro', error.message); return; }
    navigation.replace('ActiveService', { serviceId: data.id });
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f0fdf4" />
        </TouchableOpacity>
        <Text style={s.title}>Iniciar Serviço</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Equipment badge */}
      <View style={s.equipBadge}>
        <Ionicons name={equipmentType === 'machine' ? 'cog' : 'car'} size={20} color="#22c55e" />
        <Text style={s.equipText}>{equipmentName}</Text>
      </View>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Local da Atividade</Text>
          <TextInput style={s.input} placeholder="Ex: Talhão 5, Fazenda Norte" placeholderTextColor="#5a7a73"
            value={location} onChangeText={setLocation} />
        </View>

        {equipmentType === 'machine' ? (
          <View style={s.field}>
            <Text style={s.label}>Horímetro Inicial</Text>
            <TextInput style={s.input} placeholder="Ex: 180.5" placeholderTextColor="#5a7a73"
              value={hourmeter} onChangeText={setHourmeter} keyboardType="numeric" />
          </View>
        ) : (
          <View style={s.field}>
            <Text style={s.label}>Quilometragem Inicial</Text>
            <TextInput style={s.input} placeholder="Ex: 15000" placeholderTextColor="#5a7a73"
              value={mileage} onChangeText={setMileage} keyboardType="numeric" />
          </View>
        )}

        <View style={s.field}>
          <Text style={s.label}>Observações (opcional)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notas adicionais..."
            placeholderTextColor="#5a7a73" value={notes} onChangeText={setNotes} multiline />
        </View>
      </View>

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.5 }]} onPress={handleStart} disabled={loading}>
        <Ionicons name="play-circle" size={22} color="#fff" />
        <Text style={s.btnText}>{loading ? 'Iniciando...' : 'Iniciar Serviço'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', paddingTop: 60, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '600', color: '#f0fdf4' },
  equipBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 12, padding: 14, marginBottom: 24 },
  equipText: { fontSize: 15, fontWeight: '600', color: '#22c55e' },
  form: { gap: 20, marginBottom: 32 },
  field: {},
  label: { fontSize: 13, fontWeight: '500', color: '#b8d4cc', marginBottom: 6 },
  input: { backgroundColor: '#111916', borderWidth: 1, borderColor: '#2d3f3a', borderRadius: 12, padding: 14, color: '#f0fdf4', fontSize: 15 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
