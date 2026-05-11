import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { ServiceOrder } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function ActiveServiceScreen({ navigation, route }: any) {
  const { serviceId } = route.params;
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [hourmeterFinal, setHourmeterFinal] = useState('');
  const [mileageFinal, setMileageFinal] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    loadService();
    const timer = setInterval(() => {
      if (service) {
        const diff = Date.now() - new Date(service.started_at).getTime();
        const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
        setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [service?.started_at]);

  async function loadService() {
    const { data } = await supabase.from('service_orders').select('*').eq('id', serviceId).single();
    if (data) setService(data as ServiceOrder);
  }

  async function takePhoto() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;

    let lat = null, lng = null;
    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude; lng = loc.coords.longitude;
      } catch {}
    }

    const uri = result.assets[0].uri;
    setPhotos(prev => [...prev, uri]);

    // Upload to Supabase Storage
    const fileName = `${serviceId}/${Date.now()}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();
    await supabase.storage.from('service-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
    const { data: urlData } = supabase.storage.from('service-photos').getPublicUrl(fileName);

    // Register photo record
    await supabase.from('photo_records').insert({
      service_id: serviceId, image_url: urlData.publicUrl, latitude: lat, longitude: lng,
    });
  }

  async function handleFinish() {
    Alert.alert('Encerrar Serviço', 'Deseja realmente encerrar este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: async () => {
        setLoading(true);
        await supabase.from('service_orders').update({
          status: 'finished', finished_at: new Date().toISOString(),
          hourmeter_final: hourmeterFinal ? parseFloat(hourmeterFinal) : null,
          mileage_final: mileageFinal ? parseFloat(mileageFinal) : null,
          notes: notes || service?.notes,
        }).eq('id', serviceId);

        // Update machine hourmeter
        if (service?.machine_id && hourmeterFinal) {
          await supabase.from('machines').update({ hourmeter_current: parseFloat(hourmeterFinal) }).eq('id', service.machine_id);
        }
        if (service?.vehicle_id && mileageFinal) {
          await supabase.from('vehicles').update({ mileage_current: parseFloat(mileageFinal) }).eq('id', service.vehicle_id);
        }

        setLoading(false);
        navigation.replace('Home');
      }},
    ]);
  }

  if (!service) return <View style={s.container}><Text style={s.loadingText}>Carregando...</Text></View>;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#f0fdf4" /></TouchableOpacity>
        <Text style={s.title}>Serviço em Andamento</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Timer */}
      <View style={s.timerCard}>
        <Text style={s.timerLabel}>Tempo de Serviço</Text>
        <Text style={s.timer}>{elapsed}</Text>
        <Text style={s.timerStart}>Início: {new Date(service.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      {/* Info */}
      {service.location && <View style={s.infoRow}><Ionicons name="location" size={16} color="#22c55e" /><Text style={s.infoText}>{service.location}</Text></View>}

      {/* Photo Button */}
      <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
        <Ionicons name="camera" size={22} color="#22c55e" />
        <Text style={s.photoBtnText}>Tirar Foto com GPS</Text>
        {photos.length > 0 && <View style={s.photoBadge}><Text style={s.photoBadgeText}>{photos.length}</Text></View>}
      </TouchableOpacity>

      {/* Photos preview */}
      {photos.length > 0 && (
        <ScrollView horizontal style={s.photosRow}>
          {photos.map((uri, i) => <Image key={i} source={{ uri }} style={s.photoThumb} />)}
        </ScrollView>
      )}

      {/* Finish fields */}
      <View style={s.finishSection}>
        <Text style={s.sectionTitle}>Encerramento</Text>
        {service.machine_id && (
          <View style={s.field}>
            <Text style={s.label}>Horímetro Final</Text>
            <TextInput style={s.input} placeholder="Ex: 190.5" placeholderTextColor="#5a7a73" value={hourmeterFinal} onChangeText={setHourmeterFinal} keyboardType="numeric" />
          </View>
        )}
        {service.vehicle_id && (
          <View style={s.field}>
            <Text style={s.label}>Quilometragem Final</Text>
            <TextInput style={s.input} placeholder="Ex: 15200" placeholderTextColor="#5a7a73" value={mileageFinal} onChangeText={setMileageFinal} keyboardType="numeric" />
          </View>
        )}
        <View style={s.field}>
          <Text style={s.label}>Observações</Text>
          <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Notas..." placeholderTextColor="#5a7a73" value={notes} onChangeText={setNotes} multiline />
        </View>
      </View>

      <TouchableOpacity style={[s.finishBtn, loading && { opacity: 0.5 }]} onPress={handleFinish} disabled={loading}>
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={s.finishBtnText}>{loading ? 'Encerrando...' : 'Encerrar Serviço'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', paddingTop: 60, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', color: '#f0fdf4' },
  loadingText: { color: '#5a7a73', textAlign: 'center', marginTop: 40 },
  timerCard: { backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  timerLabel: { fontSize: 12, color: '#5a7a73', textTransform: 'uppercase', letterSpacing: 1 },
  timer: { fontSize: 42, fontWeight: '700', color: '#60a5fa', fontVariant: ['tabular-nums'], marginVertical: 4 },
  timerStart: { fontSize: 13, color: '#5a7a73' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  infoText: { fontSize: 14, color: '#b8d4cc' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 14, paddingVertical: 16, marginBottom: 16 },
  photoBtnText: { fontSize: 15, fontWeight: '500', color: '#22c55e' },
  photoBadge: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  photoBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  photosRow: { flexDirection: 'row', marginBottom: 24 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, marginRight: 8 },
  finishSection: { marginTop: 8, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f0fdf4', marginBottom: 4 },
  field: {},
  label: { fontSize: 13, fontWeight: '500', color: '#b8d4cc', marginBottom: 6 },
  input: { backgroundColor: '#111916', borderWidth: 1, borderColor: '#2d3f3a', borderRadius: 12, padding: 14, color: '#f0fdf4', fontSize: 15 },
  finishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 16, marginTop: 24, marginBottom: 40 },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
