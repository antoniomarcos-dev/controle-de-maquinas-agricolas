import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Machine, Vehicle } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function SelectMachineScreen({ navigation, route }: any) {
  const { journeyId } = route.params;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tab, setTab] = useState<'machines' | 'vehicles'>('machines');
  const [selected, setSelected] = useState<{ type: 'machine' | 'vehicle'; id: string; name: string } | null>(null);

  useEffect(() => {
    supabase.from('machines').select('*').eq('status', 'available').order('name').then(({ data }) => setMachines((data || []) as Machine[]));
    supabase.from('vehicles').select('*').eq('status', 'available').order('plate').then(({ data }) => setVehicles((data || []) as Vehicle[]));
  }, []);

  function handleConfirm() {
    if (!selected) { Alert.alert('Atenção', 'Selecione um equipamento.'); return; }
    navigation.navigate('StartService', { journeyId, equipmentType: selected.type, equipmentId: selected.id, equipmentName: selected.name });
  }

  const needsMaint = (m: Machine) => m.hourmeter_current >= m.maintenance_limit;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f0fdf4" />
        </TouchableOpacity>
        <Text style={s.title}>Selecionar Equipamento</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'machines' && s.tabActive]} onPress={() => setTab('machines')}>
          <Ionicons name="cog" size={18} color={tab === 'machines' ? '#22c55e' : '#5a7a73'} />
          <Text style={[s.tabText, tab === 'machines' && s.tabTextActive]}>Máquinas ({machines.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'vehicles' && s.tabActive]} onPress={() => setTab('vehicles')}>
          <Ionicons name="car" size={18} color={tab === 'vehicles' ? '#22c55e' : '#5a7a73'} />
          <Text style={[s.tabText, tab === 'vehicles' && s.tabTextActive]}>Veículos ({vehicles.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'machines' ? (
        <FlatList data={machines} keyExtractor={i => i.id} renderItem={({ item: m }) => (
          <TouchableOpacity style={[s.item, selected?.id === m.id && s.itemSelected, needsMaint(m) && s.itemWarning]}
            onPress={() => setSelected({ type: 'machine', id: m.id, name: m.name })}>
            <View style={s.itemLeft}>
              <Text style={s.itemName}>{m.name}</Text>
              <Text style={s.itemDetail}>{m.internal_number} · {m.model}</Text>
              <Text style={s.itemDetail}>Horímetro: {m.hourmeter_current.toFixed(1)}h</Text>
            </View>
            {needsMaint(m) && <Ionicons name="warning" size={20} color="#f87171" />}
            {selected?.id === m.id && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
          </TouchableOpacity>
        )} />
      ) : (
        <FlatList data={vehicles} keyExtractor={i => i.id} renderItem={({ item: v }) => (
          <TouchableOpacity style={[s.item, selected?.id === v.id && s.itemSelected]}
            onPress={() => setSelected({ type: 'vehicle', id: v.id, name: v.plate })}>
            <View style={s.itemLeft}>
              <Text style={s.itemName}>{v.plate}</Text>
              <Text style={s.itemDetail}>{v.model} · {v.mileage_current.toFixed(0)} km</Text>
            </View>
            {selected?.id === v.id && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
          </TouchableOpacity>
        )} />
      )}

      <TouchableOpacity style={[s.confirmBtn, !selected && { opacity: 0.4 }]} onPress={handleConfirm} disabled={!selected}>
        <Text style={s.confirmText}>Confirmar Seleção</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', color: '#f0fdf4' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#111916', borderWidth: 1, borderColor: '#2d3f3a' },
  tabActive: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)' },
  tabText: { fontSize: 13, color: '#5a7a73', fontWeight: '500' },
  tabTextActive: { color: '#22c55e' },
  item: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#111916', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1a2520', flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemSelected: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)' },
  itemWarning: { borderColor: 'rgba(248,113,113,0.3)' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#f0fdf4' },
  itemDetail: { fontSize: 13, color: '#5a7a73', marginTop: 2 },
  confirmBtn: { margin: 20, backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
